// Read-only audit of stored content, publication gates, URL continuity and links.
// No provider requests, runtime enrichment, full type checking or data edits.
// Usage: node scripts/auditContentValue.cjs [--write] [--baseline=<git ref>]
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { execFileSync } = require('node:child_process');
const ts = require('typescript');
const ROOT = path.resolve(__dirname, '..');
const WRITE = process.argv.includes('--write');
const BASELINE = process.argv.find(arg => arg.startsWith('--baseline='))?.slice(11) || 'HEAD';
const git = (...args) => execFileSync('git', args, { cwd: ROOT, encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] }).trim();
const baselineCommit = git('rev-parse', '--verify', `${BASELINE}^{commit}`);
const changedDataFiles = git('diff', '--name-only', baselineCommit, '--', 'data').split('\n').filter(Boolean);
const unchangedJson = new Map();
const readJson = file => {
  if (!unchangedJson.has(file)) unchangedJson.set(file, JSON.parse(fs.readFileSync(file, 'utf8')));
  return unchangedJson.get(file);
};
// Any accidental fetch in an imported module must fail closed.
global.fetch = () => { throw new Error('Network requests are disabled in the content-value audit'); };
function createLoader(ref) {
  const modules = new Map();
  function load(relative) {
    let file = path.resolve(ROOT, relative);
    if (!path.extname(file)) file += ['.ts', '.tsx', '.js', '.mjs'].find(ext => fs.existsSync(file + ext)) || '.ts';
    if (modules.has(file)) return modules.get(file).exports;
    const repoFile = path.relative(ROOT, file).split(path.sep).join('/');
    assert(!repoFile.startsWith('../'), 'Imports must remain within the repository');
    if (file.endsWith('.json')) {
      const json = ref && changedDataFiles.includes(repoFile) ? JSON.parse(git('show', `${ref}:${repoFile}`)) : readJson(file);
      modules.set(file, { exports: json });
      return json;
    }
    const mod = { exports: {} }; modules.set(file, mod);
    const source = ref ? git('show', `${ref}:${repoFile}`) : fs.readFileSync(file, 'utf8');
    const local = name => name === 'server-only' ? {} : name.startsWith('@/') ? load(name.slice(2)) : name.startsWith('.') ? load(path.resolve(path.dirname(file), name)) : require(name);
    const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true } }).outputText;
    new Function('exports', 'module', 'require', compiled)(mod.exports, mod, local);
    return mod.exports;
  }
  return load;
}
const load = createLoader();
const prior = createLoader(baselineCommit);
const dates = load('lib/dates');
const today = dates.todayYmd();
const quality = load('lib/placeQuality');
const extra = load('lib/tourExtra');
const tour = load('lib/tour');
const food = load('lib/food');
const camp = load('lib/camping');
const course = load('lib/courses');
const event = load('lib/data');
const eventQuality = load('lib/eventQuality');
const address = load('lib/address');
const pet = load('lib/petTravel');
const city = load('lib/cityTours');
const kids = load('lib/kidCourses');
const kidQuality = load('lib/kidCourseQuality');
const festival = load('lib/festivals');
const prep = load('lib/weekend-prep/data');
const dateCourses = load('lib/dateCourses').getDateCourses();
const places = tour.getAllPlaces(), restaurants = food.getAllRestaurants(), camps = camp.getAllCamps();
const courses = course.getAllCourses(), events = event.getAllEvents(), pets = pet.getPetTravelPlaces();
const allFestivalIds = [...load('data/festivals.json').festivals.map(item => item.id), ...events.filter(item => item.genreKey === 'festival').map(item => `event-${item.id}`)];
const availableFestivals = [...new Set(allFestivalIds)].map(id => festival.getFestivalById(id)).filter(Boolean);
const cities = city.getCityTours(), kidCourses = kids.getKidCourses(), festivals = festival.getAllFestivals(), preps = prep.getPrepArticles();
const rawPlaces = load('data/places.json').spots;
const rawCampRecords = load('data/camping.json').camps;
const rawEvents = load('data/events.json').events;
const rawPets = Object.values(load('data/pet-travel.json').places || {});
const eventDetails = new Map(load('data/events-archive.json').events.map(item => [item.id, { ...item, address: address.displayAddress(item.address || '', item.area), addressConflict: Boolean(item.address && !address.displayAddress(item.address, item.area)) }]));
for (const item of rawEvents) eventDetails.set(item.id, event.getEventById(item.id));
const detailEvents = [...eventDetails.values()];
const text = value => String(value || '').replace(/<[^>]*>/g, ' ').replace(/[#*`>]/g, '').replace(/\s+/g, ' ').trim();
const overview = load('data/place-overviews.json');
const article = load('lib/articles');
const useful = load('lib/displayValue').isUsefulDisplayValue;
const count = (items, check) => items.filter(check).length;
const indexedEvents = events.filter(item => item.endDate >= today && eventQuality.hasSubstantiveEventInfo(item));
const indexedFestivals = festivals.filter(item => !item.id.startsWith('event-') && item.endDate >= today && (item.description || '').trim().length >= 150);
const bucket = (items, check) => ({ total: items.length, indexable: count(items, check), noindex: count(items, item => !check(item)) });
const categories = {
  places: { ...bucket(places, item => quality.hasSubstantivePlaceInfo(item.id)), sourceRecords: rawPlaces.length, redirectedSourceRecords: rawPlaces.length - places.length },
  restaurants: bucket(restaurants, item => quality.hasSubstantiveRestaurantInfo(item.id)),
  camping: bucket(camps, quality.hasSubstantiveCampInfo),
  courses: bucket(courses, item => course.isIndexableCourse(item.id)),
  events: { ...bucket(events, item => item.endDate >= today && eventQuality.hasSubstantiveEventInfo(item)), storedCurrentRecords: rawEvents.length, addressConflictExcludedFromLists: rawEvents.length - events.length, currentAndArchiveDetailUrls: detailEvents.length, endedDetailRecords: count(detailEvents, item => item.endDate < today) },
  petTravel: { ...bucket(rawPets, item => pet.petQuality(item).publishable), publiclyListedRecords: pets.length },
  cityTours: bucket(cities, city.isIndexableCityTour),
  kidsCourses: bucket(kidCourses, kidQuality.isIndexableKidCourse),
  festivals: { ...bucket(availableFestivals, item => !item.id.startsWith('event-') && item.endDate >= today && (item.description || '').trim().length >= 150), publiclyListedCurrentRecords: festivals.length, duplicateEventAliases: count(availableFestivals, item => item.id.startsWith('event-')) },
  weekendPrep: { total: preps.length, indexable: preps.length, noindex: 0 },
  dateCourses: { total: dateCourses.length, indexable: 0, noindex: dateCourses.length },
};
const informationCoverage = {
  places: {
    publishedArticle: count(places, item => Boolean(article.getArticle(item.id))),
    cachedOverview: count(places, item => text(overview[item.id]).length > 0),
    visitRows: count(places, item => extra.introRows(item.id).length > 0),
    facilityRows: count(places, item => extra.getInfo(item.id).some(row => useful(row.text))),
    noStoredDescriptionOrVisitFacts: count(places, item => !text(article.getArticle(item.id)?.content) && !text(overview[item.id]) && !extra.introRows(item.id).length && !extra.getInfo(item.id).some(row => useful(row.text))),
    missingHours: count(places, item => !useful(extra.getIntro(item.id)?.usetime)),
    missingFeeText: count(places, item => !useful(extra.getIntro(item.id)?.fee)),
    perPlaceVisitCollectionDate: count(places, item => extra.visitInfoDates(item.id).some(row => row.at && Number.isFinite(Date.parse(row.at)))),
    missingImage: count(places, item => !item.image),
  },
  restaurants: {
    visitRows: count(restaurants, item => extra.restaurantIntroRows(item.id).length > 0),
    noStoredBusinessFacts: count(restaurants, item => !extra.restaurantIntroRows(item.id).length),
    missingHours: count(restaurants, item => !useful(extra.getRestaurantIntro(item.id)?.usetime)),
    missingMenus: count(restaurants, item => !useful(extra.getRestaurantMenu(item.id))),
    perPlaceCollectionDate: count(restaurants, item => extra.visitInfoDates(item.id, true).some(row => row.at && Number.isFinite(Date.parse(row.at)))),
    missingImage: count(restaurants, item => !item.image),
  },
  camping: {
    noIntro: count(camps, item => !text(item.intro)),
    noIntroAndFewerThanThreeFacilities: count(camps, item => !text(item.intro) && Object.values(item.facilities).filter(Boolean).length < 3),
    perPlaceCollectionDate: count(camps, item => item.checkedAt && Number.isFinite(Date.parse(item.checkedAt))),
    missingOperationPeriod: count(camps, item => !useful(item.operPd)),
    missingReservationMethod: count(camps, item => !useful(item.resve)),
    missingHomepage: count(camps, item => !item.homepage),
    missingImage: count(camps, item => !item.image),
  },
  events: {
    noDescription: count(events, item => !text(item.contents)),
    endedInCurrentList: count(events, item => item.endDate < today),
    missingOfficialUrl: count(events, item => !item.officialUrl),
    missingImage: count(events, item => !item.imgUrl),
  },
  petTravel: {
    unpublishedReasonCounts: Object.fromEntries([...new Set(rawPets.flatMap(item => pet.petQuality(item).reasons))].map(reason => [reason, count(rawPets, item => pet.petQuality(item).reasons.includes(reason))])),
  },
};
const plans = courses.map(item => ({ item, plan: load('lib/coursePlanning').courseVisitPlan(item) }));
const planStops = plans.flatMap(({item, plan}) => plan.days.flatMap(day => day.stops.map(stop => ({courseId:item.id, name:stop.name, detailHref:stop.detailHref, mapHref:stop.mapHref, facts:stop.facts}))));
const coursePlanning = {
  coursesWithPlanning: plans.length,
  coursesWithStoredVisitFacts: count(plans, item => item.plan.hasVisitFacts),
  coursesWithCompleteCoordinateSegments: count(plans, item => item.plan.days.some(day => day.totalStraightKm !== null)),
  shownStopReferences: planStops.length,
  exactPlaceDetailLinks: count(planStops, stop => Boolean(stop.detailHref)),
  mapOnlyStopReferences: count(planStops, stop => !stop.detailHref),
  mapOnlySamples: planStops.filter(stop => !stop.detailHref).slice(0, 8).map(({courseId,name}) => ({courseId,name})),
};
const currentSitemap = load('app/sitemap').default();
const oldSitemap = prior('app/sitemap').default();
const sitemapUrls = new Set(currentSitemap.map(item => item.url));
const oldSitemapUrls = new Set(oldSitemap.map(item => item.url));
const base = load('lib/site').SITE.url.replace(/\/$/, '');
const expectedDetails = [
  ...places.filter(item => quality.hasSubstantivePlaceInfo(item.id)).map(item => `/places/spot/${item.id}`),
  ...restaurants.filter(item => quality.hasSubstantiveRestaurantInfo(item.id)).map(item => `/food/spot/${item.id}`),
  ...camps.filter(quality.hasSubstantiveCampInfo).map(item => `/camping/${item.id}`),
  ...courses.filter(item => course.isIndexableCourse(item.id)).map(item => `/course/c/${item.id}`),
  ...indexedEvents.map(item => `/event/${item.id}`),
  ...pets.map(item => `/pet-travel/${item.id}`),
  ...cities.filter(city.isIndexableCityTour).map(item => `/city-tour/${item.id}`),
  ...kidCourses.filter(kidQuality.isIndexableKidCourse).map(item => `/kids/c/${item.id}`),
  ...indexedFestivals.map(item => `/festivals/${item.id}`),
  ...preps.map(item => `/weekend-prep/${item.slug}`),
];
const detailPattern = /^\/(?:places\/spot\/|food\/spot\/|camping\/\d|course\/c\/|event\/|pet-travel\/[^/]+$|city-tour\/[^/]+$|kids\/c\/|festivals\/[^/]+$|weekend-prep\/[^/]+$)/;
const actualDetails = currentSitemap.filter(item => detailPattern.test(new URL(item.url).pathname)).map(item => new URL(item.url).pathname);
const expectedSet = new Set(expectedDetails);
const missingExpected = expectedDetails.filter(url => !sitemapUrls.has(base + url));
const unexpectedDetails = actualDetails.filter(url => !expectedSet.has(url));
function routeSet(loader) {
  const result = new Set();
  for (const item of loader('data/places.json').spots) result.add(`/places/spot/${item.id}`);
  for (const item of loader('lib/food').getAllRestaurants()) result.add(`/food/spot/${item.id}`);
  for (const item of loader('lib/camping').getAllCamps()) result.add(`/camping/${item.id}`);
  for (const item of loader('lib/courses').getAllCourses()) result.add(`/course/c/${item.id}`);
  for (const item of [...loader('data/events.json').events,...loader('data/events-archive.json').events]) result.add(`/event/${item.id}`);
  for (const item of Object.values(loader('data/pet-travel.json').places || {})) result.add(`/pet-travel/${item.id}`);
  for (const item of loader('lib/cityTours').getCityTours()) result.add(`/city-tour/${item.id}`);
  for (const item of loader('lib/kidCourses').getKidCourses()) result.add(`/kids/c/${item.id}`);
  for (const item of loader('lib/dateCourses').getDateCourses()) result.add(`/date/c/${item.id}`);
  for (const item of loader('lib/weekend-prep/data').getPrepArticles()) result.add(`/weekend-prep/${item.slug}`);
  const festivals = loader('lib/festivals');
  const festivalIds = [...loader('data/festivals.json').festivals.map(item => item.id), ...loader('lib/data').getAllEvents().filter(item => item.genreKey === 'festival').map(item => `event-${item.id}`)];
  for (const id of new Set(festivalIds)) if (festivals.getFestivalById(id)) result.add(`/festivals/${id}`);
  return result;
}
const availableRoutes = routeSet(load), oldAvailableRoutes = routeSet(prior);
const removedRoutes = [...oldAvailableRoutes].filter(url => !availableRoutes.has(url));
const removedSitemap = [...oldSitemapUrls].filter(url => !sitemapUrls.has(url));
const addedSitemap = [...sitemapUrls].filter(url => !oldSitemapUrls.has(url));
const linkReferences = [];
const addLink = (href, source) => { if (typeof href === 'string' && href.startsWith('/')) linkReferences.push({href:href.split(/[?#]/)[0],source}); };
for (const item of cities) for (const linked of [...(item.related || []),...(item.foodLinks || [])]) addLink(linked.href, `city-tour/${item.id}`);
for (const item of kidCourses) for (const stop of [item.spot,item.park,item.food].filter(Boolean)) addLink(stop.href, `kids/c/${item.id}`);
for (const item of dateCourses) for (const stop of [item.cafe,item.park,item.food].filter(Boolean)) addLink(stop.href, `date/c/${item.id}`);
for (const stop of planStops) if (stop.detailHref) addLink(stop.detailHref, `course/c/${stop.courseId}`);
const missingLinkTargets = linkReferences.filter(({href}) => !availableRoutes.has(href));
const uniqueMissingTargets = [...new Set(missingLinkTargets.map(item => item.href))];
const validCoord = item => Number.isFinite(load('lib/nearby').distanceKm(item,item));
const badDisplayedMapCandidates = [...camps.map(item => ({...item,source:`camping/${item.id}`})),...restaurants.map(item => ({...item,source:`food/spot/${item.id}`}))].filter(item => item.mapx && item.mapy && !validCoord(item));
const normalizedByCampId = new Map(camps.map(item => [item.id,item.homepage]));
const sourceHomepageIssues = rawCampRecords.filter(item => item.homepage && !/^https?:\/\/[^\s<>]+$/i.test(item.homepage.trim()));
const recoveredCampHomepages = rawCampRecords.filter(item => item.homepage && normalizedByCampId.get(item.id) && normalizedByCampId.get(item.id) !== item.homepage.trim());
const withheldCampHomepages = rawCampRecords.filter(item => item.homepage && !normalizedByCampId.get(item.id));
const rawHomepageIssues = camps.filter(item => item.homepage && !/^https?:\/\/[^\s<>]+$/i.test(item.homepage.trim())).map(item => ({id:item.id,field:'homepage',classification:'Stored URL syntax needs review'}));
const checklistRoutes = ['app/places/spot/[id]/page.tsx','app/food/spot/[id]/page.tsx','app/camping/[id]/page.tsx'];
const checklistInstalled = checklistRoutes.every(file => /<VisitChecklist\b/.test(fs.readFileSync(path.join(ROOT,file),'utf8')) && /<SourceNote\b/.test(fs.readFileSync(path.join(ROOT,file),'utf8')));
const sitemapAudit = { totalUrls: currentSitemap.length, uniqueUrls:sitemapUrls.size, expectedDetailUrls:expectedDetails.length, actualDetailUrls:actualDetails.length, missingExpectedCount:missingExpected.length, unexpectedDetailCount:unexpectedDetails.length, missingExpected:missingExpected.slice(0,10), unexpectedDetails:unexpectedDetails.slice(0,10), invalidLastModifiedCount:count(currentSitemap,item=>item.lastModified && !Number.isFinite(Date.parse(item.lastModified))), baselineUrlCount:oldSitemap.length, addedCount:addedSitemap.length, removedCount:removedSitemap.length, added:addedSitemap.slice(0,10), removed:removedSitemap.slice(0,10) };
const urlContinuity = { baselineCommit, baselineAvailableDetailUrls:oldAvailableRoutes.size, currentAvailableDetailUrls:availableRoutes.size, removedCount:removedRoutes.length, removed:removedRoutes.slice(0,10), interpretation:'Stored route identity/lookup comparison; production HTTP responses are checked separately.' };
const links = { staticInternalReferencesChecked:linkReferences.length, missingReferenceCount:missingLinkTargets.length, uniqueMissingTargets:uniqueMissingTargets.length, missingSamples:missingLinkTargets.slice(0,10), malformedSourceCampHomepages:sourceHomepageIssues.length, recoveredClickableCampHomepages:recoveredCampHomepages.length, withheldNonUrlSourceCampHomepages:withheldCampHomepages.length, malformedRenderedCampHomepages:rawHomepageIssues.length, malformedHomepageSamples:rawHomepageIssues.slice(0,8), invalidNonemptyMapCoordinatePairs:badDisplayedMapCandidates.length, invalidMapSamples:badDisplayedMapCandidates.slice(0,8).map(({source})=>({source})), externalHttpStatus:'Not requested: this audit does not call providers or external websites.' };
const risks = [
  { priority:1, issue:'Stored place descriptions and visit facts are missing on many retained pages', count:informationCoverage.places.noStoredDescriptionOrVisitFacts, source:'lib/placeQuality.ts; data/place-overviews.json; lib/tourExtra.ts', mitigation:'Sparse detail URLs remain available but are excluded from the sitemap by their existing noindex gate. New checklists do not supply missing facts.' },
  { priority:3, issue:'Existing visit/business rows lack per-place collection dates', count:informationCoverage.places.visitRows-informationCoverage.places.perPlaceVisitCollectionDate+informationCoverage.restaurants.visitRows-informationCoverage.restaurants.perPlaceCollectionDate, source:'lib/tourExtra.ts::visitInfoDates; scripts/collectIntro.mjs; scripts/collectRestaurantIntro.mjs', mitigation:'Do not call a file-wide timestamp a per-place check. Updated collectors record successful retrieval dates for future refreshes.' },
  { priority:4, issue:'Course stops without an unambiguous stored place match', count:coursePlanning.mapOnlyStopReferences, source:'lib/coursePlanning.ts::resolveCoursePlace', mitigation:'Show map search instead of attaching another place\'s details or opening times. Match resolution does not make an actual route/travel-time guarantee.' },
  { priority:5, issue:'Camps lack operation-period or reservation details', count:count(camps,item=>!useful(item.operPd)||!useful(item.resve)), source:'data/camping.json; lib/visitPlanning.ts', mitigation:'Checklists explicitly ask users to confirm missing operating/reservation conditions with the operator.' },
  { priority:2, issue:'Current culture events without stored descriptive content', count:informationCoverage.events.noDescription, source:'data/events.json; lib/eventQuality.ts', mitigation:'Dates and contact facts can support an eligible page, but missing event-specific descriptions still need source enrichment. Sparse and ended detail pages retain their noindex gate.' },
];
const report = { generatedAt:new Date().toISOString(), referenceDayKst:today, mode:'stored-data-only; network disabled', categories, informationCoverage, newUiCoverage:{ checklistAndSourceInstalled:checklistInstalled, places:places.length, restaurants:restaurants.length, camping:camps.length, total:places.length+restaurants.length+camps.length, coursesWithVisitPlan:plans.length }, coursePlanning, sitemap:sitemapAudit, urlContinuity, links, risks, changedDataFiles, limitations:['Indexable/noindex counts follow the current code publication gates; they are not Google index counts or AdSense approval evidence.','Pet candidate noindex is the stored-candidate universe; only publishable candidates appear in public lists.','A usable retained URL may intentionally redirect to a canonical category/detail route.','Stored link resolution does not prove production HTTP status, external availability or search performance.'] };
const failures = [];
if (missingExpected.length || unexpectedDetails.length) failures.push('Sitemap differs from eligible detail records');
if (currentSitemap.length !== sitemapUrls.size) failures.push('Duplicate sitemap URLs');
if (removedRoutes.length) failures.push('Previously retained detail lookup identities disappeared');
if (missingLinkTargets.length) failures.push('Static internal links target missing stored identities');
if (!checklistInstalled) failures.push('Checklist/source notes missing from an expected route');
report.failures = failures;
if (WRITE) fs.writeFileSync(path.join(ROOT,'docs/content-value-audit.json'), JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({referenceDayKst:today,categories,newUiCoverage:report.newUiCoverage,sitemap:sitemapAudit,urlContinuity,links,risks,failures,...(WRITE?{report:'docs/content-value-audit.json'}:{})},null,2));
if (failures.length) process.exitCode = 1;
