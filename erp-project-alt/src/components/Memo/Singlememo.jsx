import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";

const SingleMemo = () => {
  const { id } = useParams();
  const [memo, setMemo] = useState(null);
  const BASE_URL = import.meta.env.VITE_BASE_URL;

  useEffect(() => {
    const fetchMemo = async () => {
      try {
        const res = await fetch(`${BASE_URL}/memos/${id}`);
        const data = await res.json();
        if (data.success && data.data) {
          setMemo(data.data); // ✅ use the actual memo object
        }
      } catch (err) {
        console.error("Error fetching memo:", err);
      }
    };
    fetchMemo();
  }, [id, BASE_URL]);

  if (!memo) return <p className="p-4">Loading memo...</p>;

  return (
    <div className="p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-2">{memo.title}</h2>
      <p className="text-gray-700 mb-4 whitespace-pre-wrap">{memo.content}</p>

      <div className="text-sm text-gray-600 space-y-1">
        <p><strong>Priority:</strong> {memo.priority}</p>
        <p><strong>Type:</strong> {memo.memo_type}</p>
        <p><strong>Department:</strong> {memo.sender_department}</p>
        <p><strong>Status:</strong> {memo.status}</p>
        <p><strong>Created At:</strong> {new Date(memo.created_at).toLocaleString()}</p>
      </div>
    </div>
  );
};

export default SingleMemo;
