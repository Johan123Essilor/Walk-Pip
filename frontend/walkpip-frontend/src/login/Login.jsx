import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";
import logoWalkPIP from "../assets/logoWalk-PIP.png";

export default function Login() {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [mensaje, setMensaje] = useState("");
  const [loading, setLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("http://127.0.0.1:8000/api/login/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({  
            email: correo, 
            password: contrasena }),
      });

      const data = await res.json();

      if (res.ok && data.usuario_id) {
        localStorage.setItem("usuario_id", data.usuario_id);
        localStorage.setItem("nombre", data.nombre);
        localStorage.setItem("apellido", data.apellido);
        setMensaje(`✅ Bienvenido ${data.nombre} ${data.apellido}`);
        // Redirigir al panel principal
        window.location.href = "http://127.0.0.1:8000/web/index/";
      } else {
        setMensaje(` ${data.error || "Error en el inicio de sesión"}`);
      }
    } catch (error) {
      setMensaje("⚠️ Error al conectar con el servidor");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.logo}>Walk-PIP</h1>
         <img src={logoWalkPIP} alt="Logo Walk-PIP" style={styles.loginimage} />

        <form onSubmit={handleLogin} style={styles.form}>
          <label>Correo</label>
          <input
            type="email"
            value={correo}
            onChange={(e) => setCorreo(e.target.value)}
            required
            style={styles.input}
          />

          <label>Contraseña</label>
<div style={styles.passwordContainer}>
  <input
    type={showPassword ? "text" : "password"}
    value={contrasena}
    onChange={(e) => setContrasena(e.target.value)}
    required
    style={{ ...styles.input, paddingRight: "40px" }}
  />
  <span
    onClick={() => setShowPassword(!showPassword)}
    style={styles.eyeIcon}
  >
    {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
  </span>
</div>


          <button type="submit" style={styles.button} disabled={loading}>
            {loading ? "Entrando..." : "Entrar"}
          </button>
        </form>

        <p style={{ marginTop: "1rem" }}>{mensaje}</p>
      </div>
    </div>
  );
}

const styles = {
  container: {
    backgroundColor: "#f5f5f5",
    height: "100vh",
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: "20px",
    padding: "2.5rem",
    width: "350px",
    textAlign: "center",
    boxShadow: "0 4px 20px rgba(0,0,0,0.1)",
  },
  logo: {
    fontSize: "1.8rem",
    color: "#000000ff",
    fontWeight: "light",
  },
  loginimage: {
    width: "120px",
    margin: "10px auto 20px",
    display: "block",
  },
  form: {
    textAlign: "left",
  },
  input: {
    width: "100%",
    padding: "10px",
    marginBottom: "1rem",
    borderRadius: "10px",
    border: "1px solid #D1E395",
    outline: "none",
    fontSize: "1rem",
  },
  button: {
    backgroundColor: "#5C4033",
    color: "white",
    fontWeight: "bold",
    border: "none",
    borderRadius: "10px",
    padding: "12px",
    width: "100%",
    cursor: "pointer",
  },
  passwordContainer: {
  position: "relative",
  width: "320px",
},

eyeIcon: {
  position: "absolute",
  right: "10px",
  top: "50%",
  transform: "translateY(-50%)",
  cursor: "pointer",
  color: "#66803C",
},
};

