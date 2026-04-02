import React, { useEffect } from 'react';

export default function DebugStudentId() {
  useEffect(() => {
    const user = JSON.parse(localStorage.getItem("user"));
    console.log("User object from localStorage:", user);

    const student_id =
      user?.student_id ||
      user?.linked_id ||
      user?.user?.student_id ||
      user?.user?.linked_id ||
      user?.user?.user_id ||
      user?.user?.id ||
      user?.user_id ||
      user?.id;

    console.log("Extracted student_id:", student_id);
    console.log("student_id type:", typeof student_id);
    console.log("student_id truthy:", !!student_id);
  }, []);

  return (
    <div className="container mt-4">
      <h3>Debug Student ID</h3>
      <p>Check browser console for localStorage user object and extracted student_id</p>
    </div>
  );
}