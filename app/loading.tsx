export default function Loading() {
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="mx-auto flex min-h-[45vh] w-full max-w-[1120px] items-center justify-center px-5">
      <span className="flex items-center gap-3 rounded-full bg-[#f5f7fa] px-5 py-3 text-sm font-semibold text-ink-soft">
        <span aria-hidden="true" className="h-5 w-5 motion-safe:animate-spin rounded-full border-2 border-slate-300 border-t-brandblue" />
        화면을 불러오고 있어요
      </span>
    </div>
  );
}
