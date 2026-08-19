import deploymentPromptContent from "@/content/deployment-prompt.json";
import styles from "./DeploymentPrompt.module.css";

export function DeploymentPrompt({
  label,
  help,
}: {
  label: string;
  help: string;
}) {
  return (
    <div className={styles['deployment-prompt']}>
      <label htmlFor="deployment-prompt">{label}</label>
      <p id="deployment-prompt-help">
        {help}
      </p>
      <textarea
        id="deployment-prompt"
        aria-describedby="deployment-prompt-help"
        readOnly
        rows={8}
        value={deploymentPromptContent.prompt}
      />
    </div>
  );
}
