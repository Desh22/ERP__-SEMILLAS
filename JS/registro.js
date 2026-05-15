document.addEventListener("DOMContentLoaded", () => {
    document.getElementById("register-form").addEventListener("submit", async function (event) {
        event.preventDefault(); // Evita el envío automático del formulario

        try {
            const nombre = document.getElementById("userInput").querySelector("input").value;
            const email = document.getElementById("emailInput").querySelector("input").value;
            const contraseña = document.getElementById("passwordInput").querySelector("input").value;

            // Validar campos vacíos
            if (!nombre || !email || !contraseña) {
                alert("Todos los campos son obligatorios");
                return;
            }

            const res = await fetch("http://localhost:3002/api/register", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ nombre, email, contraseña })
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
                alert("Registro exitoso");
                // Redirigir al layout.html
                window.location.href = "/layout.html";
            } else {
                alert(`Error: ${data.message || "No se pudo registrar"}`);
            }
        } catch (error) {
            console.error("Error en el registro:", error);
            alert("Error de conexión o problema inesperado");
        }
    });
});