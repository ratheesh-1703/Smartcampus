import { useEffect, useState } from "react";
import { Pie } from "react-chartjs-2";
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend
} from "chart.js";
import { apiCall, buildUrl } from "../utils/apiClient";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function CoordinatorHistory(){

  const stored = JSON.parse(localStorage.getItem("user")) || {};
  const user = stored.user || stored;
  const coordinator_id =
    user?.teacher_id ||
    user?.linked_id ||
    user?.user?.linked_id ||
    user?.user?.teacher_id ||
    user?.user_id ||
    user?.id;

  const [records, setRecords] = useState([]);
  const [summary, setSummary] = useState({ present: 0, absent: 0 });
  const [classLabel, setClassLabel] = useState("");
  const [date, setDate] = useState(
    new Date().toISOString().split("T")[0]
  );

  const loadHistory = async () => {
    if (!coordinator_id) return;
    const data = await apiCall(
      buildUrl("get_coordinator_attendance.php"),
      {
        method: "POST",
        headers: { "Content-Type":"application/json" },
        body: JSON.stringify({
          teacher_id: coordinator_id,
          date
        })
      }
    );
    if(data.status){
      setRecords(data.records);
      setSummary(data.summary);
    }
  };

  const loadClass = async () => {
    if (!coordinator_id) return;
    const data = await apiCall(
      buildUrl(`get_coordinator_summary.php?coordinator_id=${coordinator_id}`)
    );
    if (data.status) {
      setClassLabel(data.summary?.assigned_class || "");
    }
  };

  useEffect(()=>{
    loadHistory();
  }, [date]);

  useEffect(() => {
    loadClass();
  }, [coordinator_id]);

  /* 📊 Chart Data */
  const chartData = {
    labels: ["Present", "Absent"],
    datasets: [
      {
        data: [summary.present, summary.absent],
        backgroundColor: ["#198754", "#dc3545"]
      }
    ]
  };

  return (
    <div className="container mt-4">

      <h4>
        Attendance Overview {classLabel ? `– ${classLabel}` : ""}
      </h4>

      {/* Date Picker */}
      <input
        type="date"
        className="form-control w-25 mt-2"
        value={date}
        onChange={(e)=>setDate(e.target.value)}
      />

      <div className="row mt-4">

        {/* Chart */}
        <div className="col-md-4">
          <div className="card p-3 shadow">
            <h6 className="text-center">Attendance %</h6>
            <Pie data={chartData} />
          </div>
        </div>

        {/* Summary Cards */}
        <div className="col-md-8">
          <div className="row">

            <div className="col-md-4">
              <div className="card p-3 text-center bg-success text-white">
                <h6>Present</h6>
                <h3>{summary.present}</h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card p-3 text-center bg-danger text-white">
                <h6>Absent</h6>
                <h3>{summary.absent}</h3>
              </div>
            </div>

            <div className="col-md-4">
              <div className="card p-3 text-center bg-primary text-white">
                <h6>Total</h6>
                <h3>{summary.present + summary.absent}</h3>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Attendance Table */}
      <table className="table table-bordered mt-4">
        <thead className="table-dark">
          <tr>
            <th>#</th>
            <th>Name</th>
            <th>Register No</th>
            <th>Status</th>
          </tr>
        </thead>

        <tbody>
          {records.length === 0 ? (
            <tr>
              <td colSpan="4" className="text-center">
                No records
              </td>
            </tr>
          ) : (
            records.map((r, i) => (
              <tr key={`${r.reg_no}-${i}`}>
                <td>{i + 1}</td>
                <td>{r.name}</td>
                <td>{r.reg_no}</td>
                <td>
                  <span className={
                    r.status === "Present"
                      ? "badge bg-success"
                      : "badge bg-danger"
                  }>
                    {r.status}
                  </span>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

    </div>
  );
}
