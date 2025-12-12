export default async function ErrorPage({
  searchParams,
}: {
  searchParams: Promise<{ message?: string }>;
}) {
  const params = await searchParams; // ✅ unwrap the promise

  return (
    <div className="flex flex-col -mt-15 items-center justify-center min-h-screen bg-gray-50">
      <h1 className="text-3xl font-bold text-red-600 mb-4">
        Oops! Something went wrong!!
      </h1>
      <p className="text-gray-700 mb-6">
        {params.message || "Please try again later. But don't worry 😉"}
      </p>
      <a
        href="/"
        className="font-bold bg-cyan-400 text-xl hover:bg-cyan-500 text-white p-4 border rounded-md mt-4"
      >
        Return safely to Home
      </a>
    </div>
  );
}
