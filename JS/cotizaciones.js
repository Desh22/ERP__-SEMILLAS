let rowCount = 0;

        function addRow() {
            rowCount++;
            const tbody = document.getElementById('itemsBody');
            const row = document.createElement('tr');
            row.className = 'item-row';
            row.innerHTML = `
                <td>${rowCount}</td>
                <td><input type="text" onchange="calculateTotals()"></td>
                <td><input type="text" onchange="calculateTotals()"></td>
                <td><input type="number" step="1" min="0" onchange="calculateTotals()"></td>
                <td><input type="number" step="0.01" min="0" onchange="calculateTotals()"></td>
                <td><input type="number" step="0.01" min="0" max="100" onchange="calculateTotals()"></td>
                <td class="row-total">0.00 $</td>
            `;
            tbody.appendChild(row);
        }

        function calculateTotals() {
            let subtotal = 0;
            const rows = document.getElementsByClassName('item-row');
            
            Array.from(rows).forEach(row => {
                const quantity = parseFloat(row.querySelector('td:nth-child(4) input').value) || 0;
                const price = parseFloat(row.querySelector('td:nth-child(5) input').value) || 0;
                const discount = parseFloat(row.querySelector('td:nth-child(6) input').value) || 0;
                
                const rowTotal = quantity * price * (1 - discount/100);
                row.querySelector('.row-total').textContent = rowTotal.toFixed(2) + ' $';
                subtotal += rowTotal;
            });

            const iva = subtotal * 0.19;
            const total = subtotal + iva;

            document.getElementById('subtotal').textContent = subtotal.toFixed(2) + ' $';
            document.getElementById('iva').textContent = iva.toFixed(2) + ' $';
            document.getElementById('total').textContent = total.toFixed(2) + ' $';
        }

        // Initialize with one row
        document.addEventListener('DOMContentLoaded', () => {
            addRow();
            // Set current date
            const today = new Date().toISOString().split('T')[0];
            document.getElementById('quoteDate').value = today;
        });