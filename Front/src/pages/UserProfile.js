import { useAuth0 } from "@auth0/auth0-react";
import LoginButton from "../components/LoginButton";

const UserProfile = () => {
  const { user, isAuthenticated, isLoading } = useAuth0();

  if (isLoading) {
    return <div>Loading ...</div>;
  }

  return (
    isAuthenticated ? (
      <div>
        <img src={user.picture} alt={user.nombre} />
        <h2>{user.nombre}</h2>
        <p>{user.correo}</p>
      </div>
    ) : (
      <div>
        <h2>Not Logged In</h2>
        <LoginButton />
      </div>
    )
  );
};

export default UserProfile;