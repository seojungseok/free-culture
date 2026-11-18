import Link from 'next/link';
import {currentAccessiblePlace, sourceDate} from '@/lib/publicDiscovery';
import {ACCESS_FIELDS} from '@/lib/accessible.mjs';
import {ProgrammeFacts} from './ProgrammeContent';
import styles from './ExperienceBrowser.module.css';

const fields = ['stroller', 'lactationroom', 'babysparechair', 'infantsfamilyetc', 'exit', 'elevator', 'restroom'] as const;

export default function FamilyVenueAccess({venueId, generalStroller}: {venueId: string; generalStroller?: string}) {
  const place = currentAccessiblePlace(venueId);
  if (!place) return null;
  // A general attraction listing and its accessibility survey can disagree about rentals.
  const generalUnavailable = /^(없음|불가|대여불가)$/.test((generalStroller || '').replace(/\s+/g, ''));
  const accessRental = place.facts.stroller || '';
  const rentalConflict = generalUnavailable && !/없음|불가|불가능|미제공/.test(accessRental) && /가능|대여/.test(accessRental);
  const rows = fields.filter(key => place.facts[key]).map(key => [ACCESS_FIELDS[key], key === 'stroller' && rentalConflict ? '자료마다 대여 안내가 달라 방문 전 운영기관에 확인해 주세요.' : place.facts[key]]);
  if (!rows.length) return null;
  return <section className={styles.detailSection}>
    <h2>{place.title} 이동·가족 편의시설</h2>
    <ProgrammeFacts rows={rows}/>
    <p className={styles.bookingNote}>한국관광공사 무장애 여행정보 · {sourceDate(place.checkedAt)} 확인</p>
    <Link className={styles.mapLink} href={'/accessible-travel/' + place.id}>이 장소의 편의시설 전체 보기</Link>
  </section>;
}
