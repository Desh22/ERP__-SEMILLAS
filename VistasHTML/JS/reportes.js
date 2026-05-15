function generateReport() {
    // Datos de ejemplo, deberías reemplazarlos con los datos reales de tu tabla
    const data = [
        { Codigo: '001', Producto: 'Producto A', Valor: 100, Cantidad: 50, 'Fecha de compra': '2023-01-01', Usuario: 'Juan' },
        { Codigo: '002', Producto: 'Producto B', Valor: 200, Cantidad: 30, 'Fecha de compra': '2023-02-01', Usuario: 'Maria' },
        { Codigo: '003', Producto: 'Producto C', Valor: 150, Cantidad: 40, 'Fecha de compra': '2023-03-01', Usuario: 'Carlos' }
    ];

    // Crear una nueva hoja de cálculo
    const ws = XLSX.utils.json_to_sheet(data);

    // Crear un nuevo libro de trabajo
    const wb = XLSX.utils.book_new();

    // Añadir la hoja de cálculo al libro de trabajo
    XLSX.utils.book_append_sheet(wb, ws, 'Informe de Ventas');

    // Generar el archivo Excel
    XLSX.writeFile(wb, 'Informe_de_Ventas.xlsx');
}
