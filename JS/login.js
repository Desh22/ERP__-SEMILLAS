document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("login-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Evita el envío automático del formulario

        try {
            const nombre = document.getElementById("userInput").querySelector("input").value;
            const contraseña = document.getElementById("passwordInput").querySelector("input").value;

            // Validar campos vacíos
            if (!nombre || !contraseña) {
                alert("Todos los campos son obligatorios");
                return;
            }

            console.log("Datos enviados:", { nombre, contraseña });

            const res = await fetch("http://localhost:3002/api/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre, contraseña })
            });

            if (!res.ok) {
                const errorText = await res.text(); // Maneja respuestas no JSON
                console.error("Error en la respuesta del servidor:", errorText);
                alert(`Error: ${res.status} - ${res.statusText}`);
                return;
            }

            const data = await res.json();
            console.log("Datos de la respuesta:", data);

            if (res.ok) {
                alert("Inicio de sesión exitoso");
                // Redirigir al layout.html
                window.location.href = "/layout.html";
            } else {
                alert(`Error: ${data.message || "No se pudo iniciar sesión"}`);
            }
        } catch (error) {
            console.error("Error en el inicio de sesión:", error);
            alert("Error de conexión o problema inesperado");
        }
    });
});