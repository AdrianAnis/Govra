interface PageIntroProps {
  eyebrow: string;
  title: string;
  description: string;
}

function PageIntro({ eyebrow, title, description }: PageIntroProps) {
  return (
    <header className="flex flex-col gap-4 border-b pt-6 pb-10 lg:pt-10">
      <p className="text-sm font-semibold text-primary">{eyebrow}</p>
      <h1 className="text-3xl leading-tight font-bold tracking-tighter lg:text-5xl">{title}</h1>
      <p className="max-w-prose text-lg text-fg-muted">{description}</p>
    </header>
  );
}

export { PageIntro };
