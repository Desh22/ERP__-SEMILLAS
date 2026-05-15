// API URL for products
const API_URL = 'http://localhost:3002/Productos';
let currentProduct = null;
let totalVenta = 0;
let listaProductos = [];

// Información de la empresa (datos configurables)
let datosEmpresa = {
    nombre: 'ERP-Semillas',
    direccion: 'Avenida Principal 123, Santiago',
    telefono: '+56 9 1234 5678',
    rut: '12.345.678-9',
    email: 'contacto@erp-semillas.cl',
    mensajePie: '¡Gracias por su compra!'
};

// Variable para el estado de carga
let isLoading = false;

// Función que se ejecuta cuando el documento está listo
document.addEventListener('DOMContentLoaded', function() {
    // Configuración del modo oscuro
    const body = document.querySelector('body');
    const sectionVentas = document.querySelector('#ventas');
    const toggle = document.getElementById('toggle');
    
    if (toggle) {
        toggle.onclick = function() {
            toggle.classList.toggle('active');
            // Cambiar el color del fondo del body
            body.classList.toggle('modo-oscuro'); 
            // Cambiar el color del fondo del section
            sectionVentas.classList.toggle('modo-oscuro-section'); 
        };
    }
    
    // Configuración del menú toggle
    const menuToggle = document.getElementById('menu-toggle');
    const wrapper = document.getElementById('wrapper');
    
    if (menuToggle) {
        menuToggle.addEventListener('click', function() {
            wrapper.classList.toggle('toggled');
        });
    }
    
    // Crear indicador de carga
    const mainSection = document.querySelector('section');
    const loadingIndicator = document.createElement('div');
    loadingIndicator.id = 'loading-indicator';
    loadingIndicator.innerHTML = `
        <div class="spinner-border text-primary" role="status">
            <span class="sr-only">Cargando...</span>
        </div>
        <p>Procesando...</p>
    `;
    loadingIndicator.style.display = 'none';
    loadingIndicator.style.position = 'fixed';
    loadingIndicator.style.top = '50%';
    loadingIndicator.style.left = '50%';
    loadingIndicator.style.transform = 'translate(-50%, -50%)';
    loadingIndicator.style.backgroundColor = 'rgba(255, 255, 255, 0.9)';
    loadingIndicator.style.padding = '20px';
    loadingIndicator.style.borderRadius = '5px';
    loadingIndicator.style.boxShadow = '0 0 10px rgba(0, 0, 0, 0.2)';
    loadingIndicator.style.zIndex = '9999';
    loadingIndicator.style.textAlign = 'center';
    document.body.appendChild(loadingIndicator);
    
    // Agregar event listener al campo de código
    const codigoInput = document.getElementById('codigo');
    codigoInput.addEventListener('blur', buscarProductoPorCodigo);
    codigoInput.addEventListener('keypress', function(e) {
        if (e.key === 'Enter') {
            e.preventDefault();
            buscarProductoPorCodigo();
        }
    });
    // Agregar event listener al botón de agregar
    const agregarBtn = document.getElementById('btnAgregar');
    agregarBtn.addEventListener('click', agregarProducto);

    // Event listener para borrar productos
    const borrarBtn = document.getElementById('btnEliminar');
    borrarBtn.addEventListener('click', limpiarTabla);

// Event listeners para generar boleta y factura
const boletaBtn = document.getElementById('btnBoleta');
boletaBtn.addEventListener('click', () => generarComprobante('boleta'));

// La factura ahora se maneja con el modal
const btnGenerarFacturaModal = document.getElementById('btnGenerarFacturaModal');
if (btnGenerarFacturaModal) {
    btnGenerarFacturaModal.addEventListener('click', () => {
        // Validar formulario del modal
        const rutEmpresa = document.getElementById('rutEmpresaModal').value.trim();
        const email = document.getElementById('emailModal').value.trim();
        const usuario = document.getElementById('usuarioFacturaModal').value.trim();
        
        // Validar datos necesarios
        if (!rutEmpresa || !validarRutChileno(rutEmpresa)) {
            alert('Por favor, ingrese un RUT válido (Formato: 12345678-9)');
            return;
        }
        
        if (!email || !validarEmail(email)) {
            alert('Por favor, ingrese un correo electrónico válido');
            return;
        }
        
        if (!usuario) {
            alert('Por favor, ingrese el nombre del usuario');
            return;
        }
        
        // Almacenar datos para la factura
        document.getElementById('comprador').value = usuario;
        
        // Cerrar el modal
        $('#facturaModal').modal('hide');
        
        // Generar la factura con los datos recopilados
        generarComprobante('factura', {
            rutEmpresa: rutEmpresa,
            email: email,
            usuario: usuario,
            direccionEmpresa: document.getElementById('direccionEmpresaModal').value.trim(),
            giroEmpresa: document.getElementById('giroEmpresaModal').value.trim()
        });
    });
}

    // Event listener para configurar datos de la empresa
    const configEmpresaBtn = document.getElementById('btnConfigEmpresa');
    if (configEmpresaBtn) {
        configEmpresaBtn.addEventListener('click', mostrarConfiguracionEmpresa);
    }

    // Cargar datos de la empresa desde localStorage si existen
    const empresaGuardada = localStorage.getItem('datosEmpresa');
    if (empresaGuardada) {
        datosEmpresa = JSON.parse(empresaGuardada);
    }

    // Inicializar la tabla
    limpiarFormulario();
    
    // Añadir atajos de teclado globales
    document.addEventListener('keydown', function(e) {
        // F2 - Enfocar campo de código
        if (e.key === 'F2') {
            e.preventDefault();
            document.getElementById('codigo').focus();
        }
        
// F7 - Generar boleta
if (e.key === 'F7') {
    e.preventDefault();
    generarComprobante('boleta');
}
        
// F8 - Abrir modal de factura
if (e.key === 'F8') {
    e.preventDefault();
    $('#facturaModal').modal('show');
}
        
        // Esc - Limpiar formulario
        if (e.key === 'Escape') {
            e.preventDefault();
            limpiarFormulario();
        }
    });
});

// Función para mostrar/ocultar el indicador de carga
function toggleLoading(show) {
    isLoading = show;
    const loadingIndicator = document.getElementById('loading-indicator');
    loadingIndicator.style.display = show ? 'block' : 'none';
}

// Función para buscar un producto en la base de datos por su código
async function buscarProductoPorCodigo() {
    const codigo = document.getElementById('codigo').value.trim();
    
    if (!codigo) {
        // No hay código para buscar
        return;
    }
    
    // Mostrar indicador de carga
    toggleLoading(true);

    try {
        // Obtener todos los productos y buscar por código
        const response = await fetch(API_URL);
        
        if (!response.ok) {
            throw new Error('Error al obtener los productos');
        }
        
        const productos = await response.json();
        
        // Encontrar el producto con el código especificado
        currentProduct = productos.find(producto => producto.id_producto == codigo);
        
        if (currentProduct) {
            // Mostrar la información del producto en el formulario
            document.getElementById('producto').value = currentProduct.nombre;
            document.getElementById('valor').value = currentProduct.precio;
            document.getElementById('stock').value = `${currentProduct.stock} unidades`;
            document.getElementById('cantidad').value = '1'; // Por defecto, una unidad
            document.getElementById('cantidad').max = currentProduct.stock; // Limitar máximo al stock disponible
            
            // Validar que los campos sean numéricos
            document.getElementById('valor').type = 'number';
            document.getElementById('cantidad').type = 'number';
            
            // Añadir validación para el campo de cantidad
            document.getElementById('cantidad').addEventListener('input', function(e) {
                const cantidad = parseInt(e.target.value);
                const maxStock = currentProduct.stock;
                
                if (cantidad > maxStock) {
                    alert(`La cantidad no puede superar el stock disponible (${maxStock} unidades)`);
                    e.target.value = maxStock;
                }
            });
            
            // Añadir clase visual para mostrar stock bajo si es menos de 5 unidades
            if (currentProduct.stock < 5) {
                document.getElementById('stock').classList.add('text-danger', 'font-weight-bold');
            } else {
                document.getElementById('stock').classList.remove('text-danger', 'font-weight-bold');
            }
            
            // Enfocar el campo de cantidad para facilitar la entrada
            document.getElementById('cantidad').focus();
            document.getElementById('cantidad').select();
        } else {
            alert('Producto no encontrado');
            limpiarFormulario();
        }
    } catch (error) {
        console.error('Error:', error);
        alert('Error al buscar el producto');
    } finally {
        // Ocultar indicador de carga
        toggleLoading(false);
    }
}
// Función para validar el formulario
function validarFormulario() {
    // Verificar que todos los campos obligatorios estén completos
    const codigo = document.getElementById('codigo').value.trim();
    const cantidad = document.getElementById('cantidad').value.trim();
    const comprador = document.getElementById('comprador').value.trim();
    
    // Validaciones básicas
    if (!codigo) {
        alert('Por favor, ingrese un código de producto');
        document.getElementById('codigo').focus();
        return false;
    }
    
    if (!cantidad || parseInt(cantidad) <= 0) {
        alert('Por favor, ingrese una cantidad válida');
        document.getElementById('cantidad').focus();
        return false;
    }
    
    if (!comprador) {
        alert('Por favor, ingrese el nombre del cliente');
        document.getElementById('comprador').focus();
        return false;
    }
    
    // Validación de RUT chileno (opcional)
    const rut = document.getElementById('rutEmpresa').value.trim();
    if (rut && !validarRutChileno(rut)) {
        alert('El RUT ingresado no es válido. Formato correcto: 12345678-9');
        document.getElementById('rutEmpresa').focus();
        return false;
    }
    
    // Validación de email (opcional)
    const email = document.getElementById('email').value.trim();
    if (email && !validarEmail(email)) {
        alert('El correo electrónico ingresado no es válido');
        document.getElementById('email').focus();
        return false;
    }
    
    return true;
}

// Validar RUT chileno
function validarRutChileno(rut) {
    const rutRegex = /^[0-9]+-[0-9kK]{1}$/;
    return rutRegex.test(rut);
}

// Validar email
function validarEmail(email) {
    const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/;
    return emailRegex.test(email);
}

// Función para agregar un producto a la tabla de venta
async function agregarProducto() {
    // Verificar si hay un producto seleccionado
    if (!currentProduct) {
        alert('Por favor, escanee o ingrese un código de producto válido');
        return;
    }
    
    // Validar el formulario antes de continuar
    if (!validarFormulario()) {
        return;
    }

    // Obtener los valores del formulario
    const cantidad = parseInt(document.getElementById('cantidad').value);
    
    // Validación de campos
    if (isNaN(cantidad) || cantidad <= 0) {
        alert('Por favor, ingrese una cantidad válida');
        return;
    }

    // Verificar stock disponible
    if (cantidad > currentProduct.stock) {
        alert(`Stock insuficiente. Disponible: ${currentProduct.stock}`);
        return;
    }
    
    // Advertir si el stock es bajo (menos de 5 unidades)
    const stockRestanteEstimado = currentProduct.stock - cantidad;
    if (stockRestanteEstimado < 5 && stockRestanteEstimado >= 0) {
        const confirmar = confirm(`¡Advertencia! Después de esta venta, el stock de "${currentProduct.nombre}" será bajo (${stockRestanteEstimado} unidades). ¿Desea continuar?`);
        if (!confirmar) {
            return;
        }
    }
    
    // Mostrar indicador de carga
    toggleLoading(true);

    // Buscar si el producto ya existe en la lista
    const productoExistente = listaProductos.find(p => p.id === currentProduct.id_producto);
    
    if (productoExistente) {
        // Actualizar la cantidad si el producto ya está en la lista
        const nuevaCantidad = productoExistente.cantidad + cantidad;
        
        // Volver a verificar el stock con la nueva cantidad
        if (nuevaCantidad > currentProduct.stock) {
            alert(`Stock insuficiente para agregar ${cantidad} unidades más. Disponible total: ${currentProduct.stock}`);
            return;
        }
        
        productoExistente.cantidad = nuevaCantidad;
        productoExistente.subtotal = nuevaCantidad * currentProduct.precio;
    } else {
        // Agregar nuevo producto a la lista
        listaProductos.push({
            id: currentProduct.id_producto,
            nombre: currentProduct.nombre,
            precio: currentProduct.precio,
            cantidad: cantidad,
            subtotal: cantidad * currentProduct.precio,
            stock_original: currentProduct.stock
        });
    }

    // Actualizar la tabla con todos los productos
    actualizarTablaVentas();
    
    // Calcular y mostrar el total de la venta
    calcularTotal();
    
    // Limpiar el formulario para el próximo producto
    limpiarFormulario();
    
    
    // Enfoque en el campo de código para escanear el siguiente producto
    document.getElementById('codigo').focus();
    
    // Ocultar indicador de carga
    toggleLoading(false);
}
// Función para actualizar la tabla de ventas
function actualizarTablaVentas() {
    const tbody = document.querySelector('table tbody');
    tbody.innerHTML = ''; // Limpiar la tabla
    
    // Agregar cada producto a la tabla
    listaProductos.forEach((producto, index) => {
        const row = document.createElement('tr');
        
        // Formato para la fecha actual
        const fechaActual = new Date().toLocaleDateString('es-ES');
        
        // Calcular el stock restante
        const stockRestante = producto.stock_original - producto.cantidad;
        
        // Formatear el precio y subtotal para mostrar con separador de miles
        const precioFormateado = producto.precio.toLocaleString('es-CL');
        const subtotalFormateado = producto.subtotal.toLocaleString('es-CL');
        
        // Crear las celdas con la información del producto
        row.innerHTML = `
            <td>${producto.id}</td>
            <td>${producto.nombre}</td>
            <td>$${precioFormateado}</td>
            <td>${producto.cantidad}</td>
            <td>${stockRestante}</td>
            <td>$${subtotalFormateado}</td>
            <td>${fechaActual}</td>
            <td>${document.getElementById('comprador').value || 'Cliente'}</td>
        `;
        
        // Añadir clase de alerta si el stock restante es bajo
        if (stockRestante < 5) {
            row.querySelector('td:nth-child(5)').classList.add('text-danger', 'font-weight-bold');
        }
        
        // Agregar un atributo data-index para identificar la fila
        row.setAttribute('data-index', index);
        
        // Añadir botón para eliminar producto individual
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'btn btn-sm btn-danger';
        btnEliminar.innerHTML = '<i class="fas fa-trash"></i> Eliminar';
        btnEliminar.onclick = function() {
            eliminarProductoIndividual(index);
        };
        
        const tdAcciones = document.createElement('td');
        tdAcciones.appendChild(btnEliminar);
        row.appendChild(tdAcciones);
        
        // Agregar la fila a la tabla
        tbody.appendChild(row);
    });
}

// Función para calcular y mostrar el total de la venta
function calcularTotal() {
    totalVenta = listaProductos.reduce((total, producto) => total + producto.subtotal, 0);
    
    // Mostramos el total en algún elemento de la página (crear si no existe)
    let totalElement = document.getElementById('total-venta');
    
    if (!totalElement) {
        // Si no existe el elemento para mostrar el total, lo creamos
        totalElement = document.createElement('div');
        totalElement.id = 'total-venta';
        totalElement.className = 'text-right font-weight-bold mt-3';
        document.querySelector('.actions').before(totalElement);
    }
    
    // Aplicamos un estilo más destacado al total
    totalElement.innerHTML = `<div class="alert alert-success p-3">
        <h4 class="mb-0">Total: $${totalVenta.toLocaleString('es-CL')}</h4>
    </div>`;
}

// Función para limpiar el formulario
function limpiarFormulario() {
    document.getElementById('codigo').value = '';
    document.getElementById('producto').value = '';
    document.getElementById('valor').value = '';
    document.getElementById('stock').value = '';
    document.getElementById('cantidad').value = '';
    
    // Eliminar el evento listener de validación anterior
    const cantidadInput = document.getElementById('cantidad');
    const nuevoInput = cantidadInput.cloneNode(true);
    cantidadInput.parentNode.replaceChild(nuevoInput, cantidadInput);
    
    currentProduct = null;
}

// Función para eliminar un producto individual de la lista
function eliminarProductoIndividual(index) {
    // Solicitar confirmación antes de eliminar
    const producto = listaProductos[index];
    if (confirm(`¿Está seguro que desea eliminar el producto "${producto.nombre}" de la lista?`)) {
        // Eliminar el producto del array
        listaProductos.splice(index, 1);
        
        // Actualizar la tabla y el total
        actualizarTablaVentas();
        calcularTotal();
        
        // Si no quedan productos, limpiar el formulario
        if (listaProductos.length === 0) {
            limpiarFormulario();
        }
    }
}

// Función para limpiar toda la tabla y reiniciar la venta
function limpiarTabla() {
    if (listaProductos.length === 0) {
        return;
    }
    
    if (confirm('¿Está seguro que desea cancelar esta venta?')) {
        listaProductos = [];
        actualizarTablaVentas();
        calcularTotal();
        limpiarFormulario();
    }
}

// Función para generar comprobante (boleta o factura) y actualizar el inventario
async function generarComprobante(tipo, datosFactura = null) {
    if (listaProductos.length === 0) {
        alert('No hay productos en la venta actual');
        return;
    }
    
    // Mostrar indicador de carga
    toggleLoading(true);
    
    if (!document.getElementById('comprador').value) {
        alert('Por favor, ingrese el nombre del cliente');
        document.getElementById('comprador').focus();
        toggleLoading(false);
        return;
    }
    
    try {
        // Verificar conexión al servidor antes de proceder
        const testConnection = await fetch(API_URL, { method: 'HEAD' });
        if (!testConnection.ok) {
            throw new Error('No se puede conectar con el servidor. Verifique su conexión a Internet');
        }
        
        // Procesar cada producto para actualizar su inventario
        for (const producto of listaProductos) {
            // Verificar el stock actual para evitar problemas de concurrencia
            const stockResponse = await fetch(`${API_URL}/${producto.id}`);
            
            if (!stockResponse.ok) {
                throw new Error(`Error al verificar el stock actual del producto ${producto.id}`);
            }
            
            const productoActual = await stockResponse.json();
            
            // Verificar si el stock ha cambiado desde que se cargó el producto
            if (productoActual.stock < producto.stock_original) {
                const stockDisponible = productoActual.stock;
                if (stockDisponible < producto.cantidad) {
                    throw new Error(`Stock insuficiente para el producto "${producto.nombre}". Stock actual: ${stockDisponible}`);
                }
                // Actualizar el stock original con el valor actual
                producto.stock_original = stockDisponible;
            }
            
            // Calculamos el nuevo stock
            const nuevoStock = producto.stock_original - producto.cantidad;
            
            // Actualizamos el stock en la base de datos
            const response = await fetch(`${API_URL}/${producto.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    nombre: producto.nombre,
                    stock: nuevoStock,
                    precio: producto.precio
                    // No modificamos otros campos como id_categoria
                })
            });
            
            if (!response.ok) {
                // Intentar obtener más información sobre el error
                const errorText = await response.text();
                throw new Error(`Error al actualizar el stock del producto ${producto.id}: ${errorText}`);
            }
        }
        
        // Preparar datos para imprimir la boleta
        const cliente = document.getElementById('comprador').value;
        const fechaVenta = new Date().toLocaleDateString('es-CL');
        
        // Ocultar indicador de carga antes de imprimir
        toggleLoading(false);
        
        // Generar e imprimir el comprobante según el tipo seleccionado
        if (tipo === 'boleta') {
            generarBoletaSupermercado(cliente, fechaVenta, listaProductos, totalVenta);
        } else {
            // Si tenemos datos de factura, los usamos; de lo contrario, usamos valores predeterminados
            const rutEmpresaFactura = datosFactura ? datosFactura.rutEmpresa : '';
            const emailFactura = datosFactura ? datosFactura.email : '';
            const usuarioFactura = datosFactura ? datosFactura.usuario : cliente;
            const direccionEmpresaFactura = datosFactura ? datosFactura.direccionEmpresa : '';
            const giroEmpresaFactura = datosFactura ? datosFactura.giroEmpresa : '';
            
            generarFacturaSupermercado(
                usuarioFactura, 
                fechaVenta, 
                listaProductos, 
                totalVenta, 
                {
                    rutEmpresa: rutEmpresaFactura,
                    email: emailFactura,
                    direccion: direccionEmpresaFactura,
                    giro: giroEmpresaFactura
                }
            );
        }
        
        alert('Venta procesada correctamente. Se ha descontado el stock de los productos.');
        
        // Limpiar la venta actual
        listaProductos = [];
        actualizarTablaVentas();
        calcularTotal();
        limpiarFormulario();
        
    } catch (error) {
        console.error('Error al procesar la venta:', error);
        // Ocultar indicador de carga antes del alert
        toggleLoading(false);
        alert(`Error al procesar la venta: ${error.message}. Por favor, intente nuevamente.`);
        
        // Recargar los productos para obtener el stock actualizado
        buscarProductoPorCodigo();
    } finally {
        // Asegurarnos de que el indicador de carga se oculte
        toggleLoading(false);
    }
}

// Función auxiliar para formatear moneda chilena
function formatearMoneda(valor) {
    return new Intl.NumberFormat('es-CL', { 
        style: 'currency', 
        currency: 'CLP',
        minimumFractionDigits: 0
    }).format(valor);
}

// Función para generar e imprimir la boleta tipo supermercado
function generarBoletaSupermercado(cliente, fecha, productos, total) {
    // Crear un nuevo elemento div para la boleta
    const boletaContainer = document.createElement('div');
    boletaContainer.id = 'boleta-container';
    boletaContainer.className = 'boleta-print';
    
    // Número de boleta (ficticio, podría implementarse un sistema real de numeración)
    const numeroBoleta = Math.floor(Math.random() * 1000000) + 1;
    
    // Generar el HTML de la boleta
    let boletaHTML = `
        <div class="boleta-header">
            <h2>${datosEmpresa.nombre}</h2>
            <p>${datosEmpresa.direccion}</p>
            <p>RUT: ${datosEmpresa.rut}</p>
            <p>Teléfono: ${datosEmpresa.telefono}</p>
            <p>Email: ${datosEmpresa.email}</p>
            <div class="boleta-linea"></div>
            <h3>BOLETA ELECTRÓNICA</h3>
            <p>N° Boleta: ${numeroBoleta}</p>
            <p>Fecha: ${fecha}</p>
            <p>Cliente: ${cliente}</p>
            <div class="boleta-linea"></div>
        </div>
        <div class="boleta-detalle">
            <table>
                <thead>
                    <tr>
                        <th>Cant.</th>
                        <th>Producto</th>
                        <th>Precio</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Agregar cada producto a la boleta
    productos.forEach(producto => {
        boletaHTML += `
            <tr>
                <td>${producto.cantidad}</td>
                <td>${producto.nombre}</td>
                <td>${formatearMoneda(producto.precio)}</td>
                <td>${formatearMoneda(producto.subtotal)}</td>
            </tr>
        `;
    });
    
    // Cerrar la tabla y agregar el total
    boletaHTML += `
                </tbody>
            </table>
            <div class="boleta-linea"></div>
        </div>
        <div class="boleta-footer">
            <div class="boleta-total">
                <p>TOTAL: ${formatearMoneda(total)}</p>
            </div>
            <div class="boleta-mensaje">
                <p>${datosEmpresa.mensajePie}</p>
            </div>
        </div>
    `;
    
    // Asignar el HTML al contenedor
    boletaContainer.innerHTML = boletaHTML;
    
    // Agregar estilos para la impresión
    const estilosImpresion = document.createElement('style');
    estilosImpresion.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            #boleta-container, #boleta-container * {
                visibility: visible;
            }
            #boleta-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm; /* Ancho estándar para boletas */
                padding: 5mm;
            }
            .boleta-header, .boleta-detalle, .boleta-footer {
                text-align: center;
                font-family: monospace;
            }
            .boleta-header h2 {
                font-size: 18px;
                margin: 0;
            }
            .boleta-header h3 {
                font-size: 16px;
                margin: 5px 0;
            }
            .boleta-header p {
                font-size: 12px;
                margin: 3px 0;
            }
            .boleta-linea {
                border-top: 1px dashed #000;
                margin: 10px 0;
            }
            .boleta-detalle table {
                width: 100%;
                font-size: 12px;
                border-collapse: collapse;
            }
            .boleta-detalle th, .boleta-detalle td {
                text-align: left;
                padding: 3px;
            }
            .boleta-detalle th:last-child, .boleta-detalle td:last-child {
                text-align: right;
            }
            .boleta-total {
                font-size: 16px;
                font-weight: bold;
                text-align: right;
                margin: 10px 0;
            }
            .boleta-mensaje {
                font-size: 12px;
                text-align: center;
                margin-top: 15px;
            }
        }
    `;
    
    // Añadir al body
    document.body.appendChild(estilosImpresion);
    document.body.appendChild(boletaContainer);
    
    // Imprimir
    window.print();
    
    // Eliminar elementos después de imprimir
    setTimeout(() => {
        document.body.removeChild(estilosImpresion);
        document.body.removeChild(boletaContainer);
    }, 1000);
}

// Función para generar e imprimir la factura
function generarFacturaSupermercado(cliente, fecha, productos, total, datosEmpresaCliente = null) {
    // Crear un nuevo elemento div para la factura
    const facturaContainer = document.createElement('div');
    facturaContainer.id = 'factura-container';
    facturaContainer.className = 'factura-print';
    
    // Número de factura (ficticio, podría implementarse un sistema real de numeración)
    const numeroFactura = Math.floor(Math.random() * 1000000) + 1;
    
    // Generar el HTML de la factura
    let facturaHTML = `
        <div class="factura-header">
            <h2>${datosEmpresa.nombre}</h2>
            <p>${datosEmpresa.direccion}</p>
            <p>RUT: ${datosEmpresa.rut}</p>
            <p>Teléfono: ${datosEmpresa.telefono}</p>
            <p>Email: ${datosEmpresa.email}</p>
            <div class="factura-linea"></div>
            <h3>FACTURA ELECTRÓNICA</h3>
            <p>N° Factura: ${numeroFactura}</p>
            <p>Fecha: ${fecha}</p>
            <p>Cliente: ${cliente}</p>
            ${datosEmpresaCliente && datosEmpresaCliente.rutEmpresa ? `<p>RUT Cliente: ${datosEmpresaCliente.rutEmpresa}</p>` : ''}
            ${datosEmpresaCliente && datosEmpresaCliente.email ? `<p>Email: ${datosEmpresaCliente.email}</p>` : ''}
            ${datosEmpresaCliente && datosEmpresaCliente.direccion ? `<p>Dirección: ${datosEmpresaCliente.direccion}</p>` : ''}
            ${datosEmpresaCliente && datosEmpresaCliente.giro ? `<p>Giro: ${datosEmpresaCliente.giro}</p>` : ''}
            <div class="factura-linea"></div>
        </div>
        <div class="factura-detalle">
            <table>
                <thead>
                    <tr>
                        <th>Código</th>
                        <th>Descripción</th>
                        <th>Cant.</th>
                        <th>Precio Unit.</th>
                        <th>Total</th>
                    </tr>
                </thead>
                <tbody>
    `;
    
    // Agregar cada producto a la factura
    productos.forEach(producto => {
        facturaHTML += `
            <tr>
                <td>${producto.id}</td>
                <td>${producto.nombre}</td>
                <td>${producto.cantidad}</td>
                <td>${formatearMoneda(producto.precio)}</td>
                <td>${formatearMoneda(producto.subtotal)}</td>
            </tr>
        `;
    });
    
    // Calcular subtotal, IVA y total
    const subtotal = total / 1.19; // Asumiendo IVA del 19% en Chile
    const iva = total - subtotal;
    
    // Cerrar la tabla y agregar el total
    facturaHTML += `
                </tbody>
            </table>
            <div class="factura-linea"></div>
        </div>
        <div class="factura-footer">
            <div class="factura-totales">
                <p>Subtotal: ${formatearMoneda(subtotal)}</p>
                <p>IVA (19%): ${formatearMoneda(iva)}</p>
                <p class="factura-total">TOTAL: ${formatearMoneda(total)}</p>
            </div>
            <div class="factura-info-legal">
                <p>Esta factura electrónica constituye un documento tributario. El desglose de IVA se ha calculado según la normativa vigente.</p>
            </div>
            <div class="factura-mensaje">
                <p>${datosEmpresa.mensajePie}</p>
            </div>
        </div>
    `;
    
    // Asignar el HTML al contenedor
    facturaContainer.innerHTML = facturaHTML;
    
    // Agregar estilos para la impresión
    const estilosImpresion = document.createElement('style');
    estilosImpresion.textContent = `
        @media print {
            body * {
                visibility: hidden;
            }
            #factura-container, #factura-container * {
                visibility: visible;
            }
            #factura-container {
                position: absolute;
                left: 0;
                top: 0;
                width: 80mm; /* Ancho estándar para factura */
                padding: 5mm;
            }
            .factura-header, .factura-detalle, .factura-footer {
                text-align: center;
                font-family: monospace;
            }
            .factura-header h2 {
                font-size: 18px;
                margin: 0;
            }
            .factura-header h3 {
                font-size: 16px;
                margin: 5px 0;
            }
            .factura-header p {
                font-size: 12px;
                margin: 3px 0;
            }
            .factura-linea {
                border-top: 1px dashed #000;
                margin: 10px 0;
            }
            .factura-detalle table {
                width: 100%;
                font-size: 10px;
                border-collapse: collapse;
            }
            .factura-detalle th, .factura-detalle td {
                text-align: left;
                padding: 2px;
            }
            .factura-detalle th:last-child, .factura-detalle td:last-child {
                text-align: right;
            }
            .factura-totales {
                font-size: 12px;
                text-align: right;
                margin: 10px 0;
            }
            .factura-total {
                font-size: 16px;
                font-weight: bold;
            }
            .factura-info-legal {
                font-size: 9px;
                text-align: left;
                margin: 10px 0;
                font-style: italic;
            }
            .factura-mensaje {
                font-size: 12px;
                text-align: center;
                margin-top: 15px;
            }
        }
    `;
    
    // Añadir al body
    document.body.appendChild(estilosImpresion);
    document.body.appendChild(facturaContainer);
    
    // Imprimir
    window.print();
    
    // Eliminar elementos después de imprimir
    setTimeout(() => {
        document.body.removeChild(estilosImpresion);
        document.body.removeChild(facturaContainer);
    }, 1000);
}

// Función para mostrar modal de configuración de datos de empresa
function mostrarConfiguracionEmpresa() {
    // Crear el modal si no existe
    let configModal = document.getElementById('configEmpresaModal');
    
    if (!configModal) {
        configModal = document.createElement('div');
        configModal.id = 'configEmpresaModal';
        configModal.className = 'modal fade';
        configModal.setAttribute('tabindex', '-1');
        configModal.setAttribute('role', 'dialog');
        configModal.setAttribute('aria-labelledby', 'configEmpresaModalLabel');
        configModal.setAttribute('aria-hidden', 'true');
        
        // Contenido del modal
        configModal.innerHTML = `
            <div class="modal-dialog" role="document">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="configEmpresaModalLabel">Configuración de Datos de la Empresa</h5>
                        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
                            <span aria-hidden="true">&times;</span>
                        </button>
                    </div>
                    <div class="modal-body">
                        <form id="formConfigEmpresa">
                            <div class="form-group">
                                <label for="nombreEmpresa">Nombre de la Empresa</label>
                                <input type="text" class="form-control" id="nombreEmpresa" value="${datosEmpresa.nombre}">
                            </div>
                            <div class="form-group">
                                <label for="direccionEmpresa">Dirección</label>
                                <input type="text" class="form-control" id="direccionEmpresa" value="${datosEmpresa.direccion}">
                            </div>
                            <div class="form-group">
                                <label for="telefonoEmpresa">Teléfono</label>
                                <input type="text" class="form-control" id="telefonoEmpresa" value="${datosEmpresa.telefono}">
                            </div>
                            <div class="form-group">
                                <label for="rutEmpresaConfig">RUT</label>
                                <input type="text" class="form-control" id="rutEmpresaConfig" value="${datosEmpresa.rut}">
                            </div>
                            <div class="form-group">
                                <label for="emailEmpresa">Email</label>
