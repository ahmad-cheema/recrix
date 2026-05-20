import JobForm from "@/components/jobs/JobForm";

export default function NewJobPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Post a new job</h1>
        <p className="mt-2 text-sm text-[--text-secondary]">
          Fill in the details and publish when ready.
        </p>
      </div>
      <JobForm mode="create" />
    </div>
  );
}
