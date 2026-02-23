import { useAuth } from "../context/AuthContext";

const ProfilePage = () => {
  const { user } = useAuth();

  return (
    <div className="grid-layout">
      <section className="panel-card">
        <h3>Profile</h3>
        <p>
          <strong>Name:</strong> {user?.username}
        </p>
        <p>
          <strong>Email:</strong> {user?.email}
        </p>
        <p>
          <strong>User ID:</strong> {user?._id || user?.id}
        </p>
      </section>
    </div>
  );
};

export default ProfilePage;
