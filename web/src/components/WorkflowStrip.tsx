import Link from "next/link";
import { WORKFLOW_STEPS, type WorkflowStepId } from "@/lib/workflow";

export function WorkflowStrip({
  current,
  question,
}: {
  current?: WorkflowStepId | WorkflowStepId[];
  /** One-line answer to what this page is for. */
  question: string;
}) {
  const active = new Set(Array.isArray(current) ? current : current ? [current] : []);
  const currentStep = WORKFLOW_STEPS.find((step) => active.has(step.id));

  return (
    <section className="workflow" aria-label="Intelligence workflow">
      <p className="workflow-question">{question}</p>
      <ol className="workflow-steps">
        {WORKFLOW_STEPS.map((step) => {
          const isCurrent = active.has(step.id);
          const content = (
            <>
              <span className="workflow-num">{step.number}</span>
              <span className="workflow-label">{step.label}</span>
            </>
          );
          return (
            <li key={step.id} className={isCurrent ? "current" : undefined} title={`${step.summary} · ${step.owner}`}>
              {step.href && !isCurrent ? <Link href={step.href}>{content}</Link> : content}
            </li>
          );
        })}
      </ol>
      {currentStep ? (
        <p className="workflow-detail">
          <strong>
            {currentStep.number}. {currentStep.label}
          </strong>
          {" — "}
          {currentStep.summary} <span className="muted">· {currentStep.owner}</span>
        </p>
      ) : (
        <p className="workflow-detail muted">Platform overview across the full intelligence workflow.</p>
      )}
    </section>
  );
}
