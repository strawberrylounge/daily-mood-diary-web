import AssessmentForm from "./AssessmentForm";

export default async function AssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ month?: string }>;
}) {
  const { month } = await searchParams;

  return <AssessmentForm monthParam={month ?? null} />;
}
