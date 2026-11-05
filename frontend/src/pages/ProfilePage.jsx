import { useEffect, useState } from "react";
import { MapPin, Pencil, Plus, Trash2, UserRound } from "lucide-react";
import toast from "react-hot-toast";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

const blankAddress = {
  address_line: "",
  city: "",
  state: "",
  pincode: "",
  landmark: "",
  phone: "",
  is_default: false,
};
export default function ProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState({ full_name: "", phone: "" });
  const [addresses, setAddresses] = useState([]);
  const [address, setAddress] = useState(blankAddress);
  const [editing, setEditing] = useState("");
  const [busy, setBusy] = useState(false);
  const [password, setPassword] = useState("");
  useEffect(() => {
    Promise.all([api.get("/users/profile"), api.get("/users/addresses")])
      .then(([profileResult, addressResult]) => {
        setProfile({
          full_name: profileResult.data.profile.full_name,
          phone: profileResult.data.profile.phone,
        });
        setAddresses(addressResult.data.addresses || []);
      })
      .catch((error) => toast.error(error.message));
  }, []);
  async function saveProfile(event) {
    event.preventDefault();
    try {
      await api.put("/users/profile", profile);
      toast.success("Profile updated.");
    } catch (error) {
      toast.error(error.message);
    }
  }
  async function savePassword(event) {
    event.preventDefault();
    try {
      await api.put("/auth/password", { password });
      setPassword("");
      toast.success("Password changed.");
    } catch (error) {
      toast.error(error.message);
    }
  }
  async function saveAddress(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const response = editing
        ? await api.put(`/users/addresses/${editing}`, address)
        : await api.post("/users/addresses", address);
      setAddresses((current) =>
        editing
          ? current.map((item) =>
              item.id === editing ? response.data.address : item,
            )
          : [...current, response.data.address],
      );
      setAddress(blankAddress);
      setEditing("");
      toast.success(editing ? "Address updated." : "Address added.");
    } catch (error) {
      toast.error(error.message);
    } finally {
      setBusy(false);
    }
  }
  async function removeAddress(id) {
    try {
      await api.delete(`/users/addresses/${id}`);
      setAddresses((current) => current.filter((item) => item.id !== id));
      toast.success("Address removed.");
    } catch (error) {
      toast.error(error.message);
    }
  }
  function editAddress(item) {
    setEditing(item.id);
    setAddress({ ...blankAddress, ...item });
  }
  return (
    <div className="profile-page">
      <section className="profile-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">YOUR ACCOUNT</span>
            <h2>Personal details</h2>
          </div>
          <span className="profile-large-icon">
            <UserRound size={20} />
          </span>
        </div>
        <form className="profile-form" onSubmit={saveProfile}>
          <label>
            Full name
            <input
              required
              minLength="2"
              value={profile.full_name}
              onChange={(event) =>
                setProfile({ ...profile, full_name: event.target.value })
              }
            />
          </label>
          <label>
            Email address
            <input disabled value={user?.email || ""} />
          </label>
          <label>
            Mobile number
            <input
              required
              value={profile.phone}
              onChange={(event) =>
                setProfile({ ...profile, phone: event.target.value })
              }
            />
          </label>
          <button className="button button-dark button-small">
            Save details
          </button>
        </form>
        <form className="password-form" onSubmit={savePassword}>
          <h3>Change password</h3>
          <label>
            New password
            <input
              type="password"
              required
              minLength="8"
              maxLength="128"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
            />
          </label>
          <button className="button button-dark button-small">
            Update password
          </button>
        </form>
      </section>
      <section className="profile-panel">
        <div className="panel-heading">
          <div>
            <span className="eyebrow">PICKUP & DELIVERY</span>
            <h2>Your addresses</h2>
          </div>
          <span className="profile-large-icon">
            <MapPin size={20} />
          </span>
        </div>
        <div className="saved-addresses">
          {addresses.map((item) => (
            <article className="saved-address" key={item.id}>
              <div>
                <b>{item.address_line}</b>
                <small>
                  {item.city}, {item.state} {item.pincode}
                </small>
                {item.phone && <small>{item.phone}</small>}
                {item.is_default && (
                  <span className="address-default">DEFAULT</span>
                )}
              </div>
              <div>
                <button title="Edit address" onClick={() => editAddress(item)}>
                  <Pencil size={15} />
                </button>
                <button
                  title="Delete address"
                  onClick={() => removeAddress(item.id)}
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </article>
          ))}
        </div>
        <form className="address-form" onSubmit={saveAddress}>
          <h3>{editing ? "Edit address" : "Add an address"}</h3>
          <input
            required
            maxLength="240"
            placeholder="House / street / area"
            value={address.address_line}
            onChange={(event) =>
              setAddress({ ...address, address_line: event.target.value })
            }
          />
          <div>
            <input
              required
              placeholder="City"
              value={address.city}
              onChange={(event) =>
                setAddress({ ...address, city: event.target.value })
              }
            />
            <input
              placeholder="State"
              value={address.state}
              onChange={(event) =>
                setAddress({ ...address, state: event.target.value })
              }
            />
            <input
              required
              inputMode="numeric"
              pattern="[0-9]{6}"
              placeholder="Pincode"
              value={address.pincode}
              onChange={(event) =>
                setAddress({ ...address, pincode: event.target.value })
              }
            />
          </div>
          <div>
            <input
              placeholder="Mobile number"
              value={address.phone}
              onChange={(event) =>
                setAddress({ ...address, phone: event.target.value })
              }
            />
            <input
              placeholder="Landmark (optional)"
              value={address.landmark}
              onChange={(event) =>
                setAddress({ ...address, landmark: event.target.value })
              }
            />
          </div>
          <label className="default-address">
            <input
              type="checkbox"
              checked={address.is_default}
              onChange={(event) =>
                setAddress({ ...address, is_default: event.target.checked })
              }
            />{" "}
            Make this my default address
          </label>
          <div className="profile-form-actions">
            <button className="button button-dark button-small" disabled={busy}>
              {editing ? (
                "Save address"
              ) : (
                <>
                  <Plus size={14} /> Add address
                </>
              )}
            </button>
            {editing && (
              <button
                className="text-action"
                type="button"
                onClick={() => {
                  setEditing("");
                  setAddress(blankAddress);
                }}
              >
                Cancel
              </button>
            )}
          </div>
        </form>
      </section>
    </div>
  );
}
