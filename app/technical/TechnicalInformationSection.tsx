import type { ReactNode } from "react";
import styles from "../information-page.module.css";

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
    <section className={styles['public-information-section']} aria-labelledby={headingId}>
      <h2 id={headingId}>{title}</h2>
      {children}
    </section>
  );
}
