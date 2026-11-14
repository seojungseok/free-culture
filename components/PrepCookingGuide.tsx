import cooking from '@/data/prep-cooking-guides.json';

type Guide = {
  title: string; servings: string; lead: string; ingredients: string[];
  steps: {title: string; text: string}[];
  fixes: {problem: string; solution: string}[];
  alternative: string; safety: string; sources: {title: string; url: string}[];
};
const guides: Record<string, Guide> = cooking.guides;
export function hasDetailedCookingGuide(slug: string) { return Boolean(guides[slug]); }

export default function PrepCookingGuide({slug}: {slug: string}) {
  const guide = guides[slug];
  if (!guide) return null;
  return <section id="prep-cooking" className="prep-cooking-intro prep-detailed-cooking" aria-label={guide.title}>
    <h2>{guide.title}</h2>
    <p>{guide.lead}</p>
    <div className="prep-recipe-amounts">
      <h3>{guide.servings} 분량 예시</h3>
      <ul>{guide.ingredients.map(item => <li key={item}>{item}</li>)}</ul>
      <p className="prep-cooking-note">1큰술은 15mL, 1작은술은 5mL, 1컵은 200mL 기준입니다. 일반 재료로 만드는 예시이며, 밀키트·육수팩·시판 양념의 물과 가열 방법은 제품 포장 안내를 우선하세요. 선택 재료는 없어도 됩니다.</p>
    </div>
    <h3>이 순서로 만들어 보세요</h3>
    <ol className="prep-cooking-steps">{guide.steps.map(step => <li key={step.title}><strong>{step.title}</strong><span>{step.text}</span></li>)}</ol>
    <div className="prep-recipe-fixes"><h3>맛이 아쉬울 때 고치는 법</h3><dl>{guide.fixes.map(fix => <div key={fix.problem}><dt>{fix.problem}</dt><dd>{fix.solution}</dd></div>)}</dl></div>
    <h3>재료를 바꾸고 싶다면</h3><p>{guide.alternative}</p>
    <p className="prep-cooking-note">{guide.safety}</p>
    <p className="prep-cooking-note">남은 음식은 큰 냄비째 오래 식히지 말고 얕은 용기에 나누어 신속히 냉장하세요. 보냉이 끊겼거나 보관 상태를 알 수 없는 재료는 다시 끓여서 사용하지 마세요.</p>
    <details className="prep-recipe-sources"><summary>참고한 조리·식품 안전 자료</summary><p>재료 구성과 손질 정보를 참고해 캠핑 장보기와 조리에 맞춰 다시 정리했습니다. 분량은 입맛과 제품에 맞게 조절하는 예시입니다. 자료 확인: {cooking.checkedAt.slice(0, 10)}</p><ul>{guide.sources.map(source => <li key={source.url}><a href={source.url} target="_blank" rel="noopener noreferrer">{source.title}</a></li>)}<li><a href={cooking.safetySource.url} target="_blank" rel="noopener noreferrer">{cooking.safetySource.title}</a></li></ul></details>
  </section>;
}
