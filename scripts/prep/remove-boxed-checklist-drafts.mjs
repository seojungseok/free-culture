import {readStore, saveStore} from './store.mjs';

const removeSlugs = new Set([
  'camp-griddle-barbecue-party',
  'camp-woodfire-snack-checklist',
  'camp-omandungi-maeuntang-checklist',
  'camp-ham-paprika-stirfry-checklist',
  'camp-ham-cheese-friedrice-checklist',
  'camp-sundae-jeongol-checklist',
  'camp-chicken-skewer-bbq-checklist',
  'camp-samgyeopsal-bbq-ingredient-checklist',
  'camp-woodfire-ciabatta-toast-checklist',
  'camp-jidan-gimgaru-breakfast-checklist',
  'camp-paprika-cheese-grill-checklist',
]);

const store = readStore();
const removed = store.articles.filter(article => removeSlugs.has(article.slug)).map(article => article.slug);
store.articles = store.articles.filter(article => !removeSlugs.has(article.slug));
saveStore(store, store.version);
console.log(JSON.stringify({removed, remaining: store.articles.length}));
