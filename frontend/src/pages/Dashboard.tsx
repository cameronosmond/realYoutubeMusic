import { useState } from "react";

interface Props {
  userId: string;
}

function Dashboard({ userId }: Props) {
  const [loading, setLoading] = useState(false);

  const getSongs = async (formData: FormData) => {
    setLoading(true);

    const query = formData.get("artistName") as string;
    const artistName = query.toLowerCase();
  };

  return (
    <form action={getSongs}>
      <label>
        Enter artist name: <input name="artistName" />
        <button type="submit">Search</button>
      </label>
    </form>
  );
}

export default Dashboard;
