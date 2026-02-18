const Gastos = {
    currentDate: new Date(),
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        
        return `
            <div class="gastos-view">
                <div class="card">
                    <h3 class="section-title">Nuevo gasto</h3>
                    <form id="formGasto">
                        <div class="form-group">
                            <label class="form-label">Fecha</label>
                            <input type="date" class="form-input" id="gastoFecha" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cantidad</label>
                            <input type="number" step="0.01" class="form-input" id="gastoCantidad" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo</label>
                            <select class="form-input" id="gastoTipo">
                                ${FinanzasApp.data.config.tiposGasto.map(t => `<option value="${t}">${t}</option>`).join('')}
                                <option value="nuevo">+ Agregar nuevo tipo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Descripción (opcional)</label>
                            <input type="text" class="form-input" id="gastoDescripcion">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Monedero origen</label>
                            <select class="form-input" id="gastoMonedero" required>
                                ${FinanzasApp.data.monederos.map(m => `<option value="${m.id}">${m.nombre} (${FinanzasApp.formatCurrency(m.saldo)})</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Frecuencia</label>
                            <select class="form-input" id="gastoFrecuencia">
                                <option value="puntual">Puntual</option>
                                <option value="diario">Diario</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Registrar gasto</button>
                    </form>
                </div>

                <div class="card calendar-card">
                    <div class="calendar-header">
                        <button class="calendar-nav" id="prevMonth">←</button>
                        <h3>${this.getMonthName(month)} ${year} - Gastos</h3>
                        <button class="calendar-nav" id="nextMonth">→</button>
                    </div>
                    
                    <div class="calendar-weekdays">
                        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                    </div>
                    
                    <div class="calendar-grid">
                        ${Array(startDay).fill('<div class="calendar-day empty"></div>').join('')}
                        
                        ${Array.from({ length: daysInMonth }, (_, i) => {
                            const day = i + 1;
                            const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
                            const gastosDia = this.getGastosDelDia(dateStr);
                            const total = gastosDia.reduce((sum, g) => sum + g.cantidad, 0);
                            
                            return `
                                <div class="calendar-day ${total > 0 ? 'has-gastos' : ''}" 
                                     data-date="${dateStr}"
                                     onclick="Gastos.mostrarGastosDia('${dateStr}')">
                                    <span class="day-number">${day}</span>
                                    ${total > 0 ? `
                                        <div class="day-total negative">
                                            ${total.toFixed(0)}€
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="calendar-legend">
                        <span><span class="legend-dot negative"></span> Días con gastos</span>
                    </div>
                </div>

                <div class="card" id="detalleDia" style="display: none;">
                    <div class="detalle-header">
                        <h3 class="section-title" id="diaSeleccionado">Selecciona un día</h3>
                        <button class="btn-icon" onclick="Gastos.cerrarDetalle()">✕</button>
                    </div>
                    <div id="listaGastosDia"></div>
                </div>

                <div class="card">
                    <h3 class="section-title">Resumen por categorías</h3>
                    <div id="resumenCategorias">
                        ${this.renderResumenCategorias()}
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        document.getElementById('formGasto').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarGasto();
        });

        document.getElementById('gastoTipo').addEventListener('change', (e) => {
            if (e.target.value === 'nuevo') {
                this.agregarNuevoTipo();
            }
        });

        document.getElementById('prevMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() - 1);
            this.actualizarVista();
        });

        document.getElementById('nextMonth')?.addEventListener('click', () => {
            this.currentDate.setMonth(this.currentDate.getMonth() + 1);
            this.actualizarVista();
        });
        
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('gastoFecha').value = hoy;
    },

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    },

    getGastosDelDia(dateStr) {
        return FinanzasApp.data.gastos.filter(g => g.fecha === dateStr);
    },

    renderResumenCategorias() {
        const totales = {};
        
        FinanzasApp.data.gastos.forEach(g => {
            if (!totales[g.tipo]) {
                totales[g.tipo] = 0;
            }
            totales[g.tipo] += g.cantidad;
        });

        if (Object.keys(totales).length === 0) {
            return '<p class="empty-state">No hay gastos para mostrar</p>';
        }

        const maxTotal = Math.max(...Object.values(totales));

        return Object.entries(totales).map(([tipo, total]) => `
            <div class="categoria-item">
                <div class="categoria-header">
                    <span class="categoria-nombre">${tipo}</span>
                    <span class="categoria-total">${FinanzasApp.formatCurrency(total)}</span>
                </div>
                <div class="progress-bar">
                    <div class="progress-fill" style="width: ${(total / maxTotal) * 100}%"></div>
                </div>
            </div>
        `).join('');
    },

    async agregarNuevoTipo() {
        const nuevoTipo = await FinanzasApp.showPrompt('Nuevo tipo de gasto', 'Nombre:', 'text');
        if (nuevoTipo && nuevoTipo.trim()) {
            FinanzasApp.data.config.tiposGasto.push(nuevoTipo.trim());
            FinanzasApp.saveData();
            
            const select = document.getElementById('gastoTipo');
            select.innerHTML = FinanzasApp.data.config.tiposGasto.map(t => 
                `<option value="${t}">${t}</option>`
            ).join('') + '<option value="nuevo">+ Agregar nuevo tipo</option>';
            select.value = nuevoTipo.trim();
        }
    },

    async mostrarGastosDia(dateStr) {
        const gastos = this.getGastosDelDia(dateStr);
        const fecha = new Date(dateStr + 'T12:00:00');
        const titulo = fecha.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('diaSeleccionado').textContent = titulo;
        
        if (gastos.length === 0) {
            document.getElementById('listaGastosDia').innerHTML = `
                <p class="empty-state">No hay gastos este día</p>
            `;
        } else {
            document.getElementById('listaGastosDia').innerHTML = `
                <ul class="movimientos-list">
                    ${gastos.map(g => `
                        <li class="movimiento-item" data-id="${g.id}">
                            <div class="movimiento-icon gasto">G</div>
                            <div class="movimiento-info">
                                <div class="movimiento-concepto">${g.tipo === 'gasto' ? 'Gasto' : g.tipo} - ${g.descripcion || 'Sin descripción'}</div>
                                <div class="movimiento-fecha">${FinanzasApp.formatDate(g.fecha)}</div>
                            </div>
                            <div class="movimiento-cantidad gasto">- ${FinanzasApp.formatCurrency(g.cantidad)}</div>
                            <div class="movimiento-actions">
                                <button class="btn-icon" onclick="Gastos.editarGasto('${g.id}')">✏️</button>
                                <button class="btn-icon" onclick="Gastos.eliminarGasto('${g.id}')">🗑️</button>
                            </div>
                        </li>
                    `).join('')}
                </ul>
            `;
        }
        
        document.getElementById('detalleDia').style.display = 'block';
    },

    cerrarDetalle() {
        document.getElementById('detalleDia').style.display = 'none';
    },

    registrarGasto() {
        const fecha = document.getElementById('gastoFecha').value;
        const cantidad = parseFloat(document.getElementById('gastoCantidad').value);
        const tipo = document.getElementById('gastoTipo').value;
        const descripcion = document.getElementById('gastoDescripcion').value;
        const monederoId = document.getElementById('gastoMonedero').value;
        const frecuencia = document.getElementById('gastoFrecuencia').value;

        if (!fecha || !cantidad || !monederoId) {
            FinanzasApp.showMessage('Error', 'Completa todos los campos obligatorios', 'error');
            return;
        }

        const monedero = FinanzasApp.data.monederos.find(m => m.id === monederoId);
        if (monedero.saldo < cantidad) {
            FinanzasApp.showMessage('Saldo insuficiente', 
                `El monedero tiene ${FinanzasApp.formatCurrency(monedero.saldo)}`, 
                'error');
            return;
        }

        const nuevoGasto = {
            id: Date.now().toString(),
            fecha: fecha,
            cantidad: cantidad,
            tipo: tipo,
            descripcion: descripcion,
            monederoId: monederoId,
            frecuencia: frecuencia
        };

        FinanzasApp.data.gastos.push(nuevoGasto);
        monedero.saldo -= cantidad;

        FinanzasApp.saveData();
        
        this.actualizarVista();
        document.getElementById('formGasto').reset();
        
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('gastoFecha').value = hoy;
        
        FinanzasApp.showMessage('Gasto registrado', 'El gasto se ha guardado correctamente', 'success');
    },

    async editarGasto(id) {
        const gasto = FinanzasApp.data.gastos.find(g => g.id === id);
        if (!gasto) return;
        
        const nuevaCantidad = await FinanzasApp.showPrompt('Editar gasto', 'Nueva cantidad:', 'number', gasto.cantidad.toString());
        if (nuevaCantidad) {
            const cantidad = parseFloat(nuevaCantidad);
            if (cantidad > 0) {
                const monedero = FinanzasApp.data.monederos.find(m => m.id === gasto.monederoId);
                if (monedero) {
                    monedero.saldo += gasto.cantidad;
                    if (monedero.saldo >= cantidad) {
                        monedero.saldo -= cantidad;
                        gasto.cantidad = cantidad;
                        FinanzasApp.saveData();
                        this.actualizarVista();
                        FinanzasApp.showMessage('Gasto actualizado', 'La cantidad se ha modificado correctamente', 'success');
                    } else {
                        monedero.saldo -= gasto.cantidad;
                        FinanzasApp.showMessage('Saldo insuficiente', 'No hay suficiente saldo para esta edición', 'error');
                    }
                }
            }
        }
    },

    async eliminarGasto(id) {
        const confirmar = await FinanzasApp.showConfirm('Eliminar gasto', '¿Estás seguro de eliminar este gasto?');
        if (confirmar) {
            const gasto = FinanzasApp.data.gastos.find(g => g.id === id);
            if (gasto) {
                const monedero = FinanzasApp.data.monederos.find(m => m.id === gasto.monederoId);
                if (monedero) {
                    monedero.saldo += gasto.cantidad;
                }
                
                FinanzasApp.data.gastos = FinanzasApp.data.gastos.filter(g => g.id !== id);
                FinanzasApp.saveData();
                this.actualizarVista();
                FinanzasApp.showMessage('Gasto eliminado', 'El gasto se ha eliminado correctamente', 'success');
            }
        }
    },

    actualizarVista() {
        FinanzasApp.renderView('gastos');
    }
};

window.Gastos = Gastos;