
/** The page title row (report §1, `.header-nav`). */
export function PageHeader({ title }: { title: string }) {
  return (
    <div className="mx-(--body-gutter) pt-8 max-md:pt-4 [@media(orientation:landscape)_and_(max-height:540px)]:pt-3">
      <h1 className="type-header-emphasized">{title}</h1>
    </div>
  );
}
