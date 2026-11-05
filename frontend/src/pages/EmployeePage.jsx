import { useEffect, useState } from "react";
import {
  ArrowUpRight,
  MapPin,
  Navigation,
  PackageCheck,
  Phone,
  Shirt,
} from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";

const statuses = [
  "assigned",
  "on_the_way",
  "picked_up",
  "out_for_delivery",
  "delivered",
];
export default function EmployeePage() {
  const [tasks, setTasks] = useState([]);
  const [error, setError] = useState("");
  useEffect(() => {
    api
      .get("/employee/tasks")
      .then(({ data }) => setTasks(data.tasks || []))
      .catch((err) => setError(err.message));
  }, []);
  async function updateTask(task, status) {
    if (
      status === "delivered" &&
      !window.confirm("Confirm that the customer received this order?")
    )
      return;
    try {
      await api.patch(`/employee/tasks/${task.id}/status`, {
        status,
        delivery_confirmed: status === "delivered",
      });
      setTasks((current) =>
        current.map((item) =>
          item.id === task.id ? { ...item, status } : item,
        ),
      );
      toast.success("Task updated.");
    } catch (err) {
      toast.error(err.message);
    }
  }
  return (
    <div className="employee-page">
      {error && (
        <div className="connection-note">
          <b>Your route is not connected yet.</b>
          <p>
            {error}. Once your account is assigned to tasks in the admin system,
            they will show up here.
          </p>
        </div>
      )}
      <div className="employee-route-strip">
        <div>
          <span className="eyebrow">TODAY’S ROUTE</span>
          <b>
            {tasks.length} {tasks.length === 1 ? "stop" : "stops"} assigned
          </b>
        </div>
        <span className="route-icon">
          <Navigation size={19} />
        </span>
      </div>
      {tasks.length ? (
        <div className="task-list">
          {tasks.map((task, index) => (
            <article className="task-card" key={task.id}>
              <div className="task-index">
                {String(index + 1).padStart(2, "0")}
              </div>
              <div className="task-main">
                <div className="task-heading">
                  <div>
                    <span className="eyebrow">
                      {task.assignment_type?.toUpperCase()} ·{" "}
                      {task.order?.order_number}
                    </span>
                    <h2>{task.order?.customer?.full_name || "Customer"}</h2>
                  </div>
                  <span className={`order-status status-${task.status}`}>
                    {task.status?.replaceAll("_", " ")}
                  </span>
                </div>
                <p className="task-address">
                  <MapPin size={16} /> {task.order?.address?.address_line},{" "}
                  {task.order?.address?.city} {task.order?.address?.pincode}
                </p>
                <div className="task-contact">
                  <span>
                    <Phone size={14} />{" "}
                    {task.order?.address?.phone || task.order?.customer?.phone}
                  </span>
                  <span>
                    <Shirt size={14} /> {task.order?.order_number}
                  </span>
                </div>
                <div className="task-actions">
                  <a
                    className="text-action"
                    href={`tel:${task.order?.address?.phone || task.order?.customer?.phone}`}
                  >
                    <Phone size={15} /> Call customer
                  </a>
                  <a
                    className="text-action"
                    target="_blank"
                    rel="noreferrer"
                    href={`https://maps.google.com/?q=${encodeURIComponent(`${task.order?.address?.address_line}, ${task.order?.address?.city}`)}`}
                  >
                    <MapPin size={15} /> Directions
                  </a>
                  <select
                    value={task.status}
                    onChange={(event) => updateTask(task, event.target.value)}
                    aria-label="Update task status"
                  >
                    {statuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replaceAll("_", " ")}
                      </option>
                    ))}
                  </select>
                  <ArrowUpRight size={16} />
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        !error && (
          <div className="empty-orders">
            <PackageCheck size={28} />
            <h3>A clear route.</h3>
            <p>Assigned pickup and delivery tasks will appear here.</p>
          </div>
        )
      )}
    </div>
  );
}
