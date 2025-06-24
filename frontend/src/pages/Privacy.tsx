// /src/pages/Privacy.tsx
export default function Privacy() {
  return (
    <div className="p-4 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Privacy Policy</h1>
      <p>Last updated: June 23, 2025</p>

      <h2 className="mt-4 text-xl font-semibold">Information We Collect</h2>
      <p>
        We may collect basic Google profile info such as your name and email if
        you sign in.
      </p>

      <h2 className="mt-4 text-xl font-semibold">How We Use It</h2>
      <ul className="list-disc list-inside">
        <li>To personalize your experience</li>
        <li>To access and display your YouTube Music data</li>
      </ul>

      <h2 className="mt-4 text-xl font-semibold">Data Sharing</h2>
      <p>We don’t sell or share your data with third parties.</p>

      <h2 className="mt-4 text-xl font-semibold">Contact</h2>
      <p>
        Email us at <em>cameronosmond05@gmail.com</em> if you have questions.
      </p>
    </div>
  );
}
