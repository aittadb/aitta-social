import type { ReactNode } from "react";

type TechnicalInformationSectionProps = {
  headingId: string;
  title: string;
  children: ReactNode;
};

export function TechnicalInformationSection({
  headingId,
  title,
  children,
}: TechnicalInformationSectionProps) {
  return (
    <section className="public-information-section" aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}
