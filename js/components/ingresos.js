const Ingresos = {
    currentDate: new Date(),
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        
        return `
            <div class="ingresos-view">
                <div class="card">
                    <h3 class="section-title">Nuevo ingreso</h3>
                    <form id="formIngreso">
                        <div class="form-group">
                            <label class="form-label">Fecha</label>
                            <input type="date" class="form-input" id="ingresoFecha" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Cantidad</label>
                            <input type="number" step="0.01" class="form-input" id="ingresoCantidad" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Tipo</label>
                            <select class="form-input" id="ingresoTipo">
                                ${FinanzasApp.data.config.tiposIngreso.map(t => `<option value="${t}">${t}</option>`).join('')}
                                <option value="nuevo">+ Agregar nuevo tipo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Descripción (opcional)</label>
                            <input type="text" class="form-input" id="ingresoDescripcion">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Monedero destino</label>
                            <select class="form-input" id="ingresoMonedero">
                                ${FinanzasApp.data.monederos.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Alcancía destino (opcional)</label>
                            <select class="form-input" id="ingresoAlcancia">
                                <option value="">Ninguna</option>
                                ${FinanzasApp.data.alcancias.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Frecuencia</label>
                            <select class="form-input" id="ingresoFrecuencia">
                                <option value="puntual">Puntual</option>
                                <option value="diario">Diario</option>
                                <option value="mensual">Mensual</option>
                            </select>
                        </div>
                        <button type="submit" class="btn btn-primary">Registrar ingreso</button>
                    </form>
                </div>

                <div class="card calendar-card">
                    <div class="calendar-header">
                        <button class="calendar-nav" id="prevMonth">←</button>
                        <h3>${this.getMonthName(month)} ${year} - Ingresos</h3>
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
                            const ingresosDia = this.getIngresosDelDia(dateStr);
                            const total = ingresosDia.reduce((sum, i) => sum + i.cantidad, 0);
                            
                            return `
                                <div class="calendar-day ${total > 0 ? 'has-ingresos' : ''}" 
                                     data-date="${dateStr}"
                                     onclick="Ingresos.mostrarIngresosDia('${dateStr}')">
                                    <span class="day-number">${day}</span>
                                    ${total > 0 ? `
                                        <div class="day-total positive">
                                            ${total.toFixed(0)}$
                                        </div>
                                    ` : ''}
                                </div>
                            `;
                        }).join('')}
                    </div>
                    
                    <div class="calendar-legend">
                        <span><span class="legend-dot positive"></span> Días con ingresos</span>
                    </div>
                </div>

                <div class="card" id="detalleDia" style="display: none;">
                    <div class="detalle-header">
                        <h3 class="section-title" id="diaSeleccionado">Selecciona un día</h3>
                        <button class="btn-icon" onclick="Ingresos.cerrarDetalle()">✕</button>
                    </div>
                    <div id="listaIngresosDia"></div>
                </div>
            </div>
        `;
    },

    init() {
        document.getElementById('formIngreso').addEventListener('submit', (e) => {
            e.preventDefault();
            this.registrarIngreso();
        });

        document.getElementById('ingresoTipo').addEventListener('change', (e) => {
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
        document.getElementById('ingresoFecha').value = hoy;
    },

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    },

    getIngresosDelDia(dateStr) {
        return FinanzasApp.data.ingresos.filter(i => i.fecha === dateStr);
    },

    async agregarNuevoTipo() {
        const nuevoTipo = await FinanzasApp.showPrompt('Nuevo tipo de ingreso', 'Nombre:', 'text');
        if (nuevoTipo && nuevoTipo.trim()) {
            FinanzasApp.data.config.tiposIngreso.push(nuevoTipo.trim());
            FinanzasApp.saveData();
            
            const select = document.getElementById('ingresoTipo');
            select.innerHTML = FinanzasApp.data.config.tiposIngreso.map(t => 
                `<option value="${t}">${t}</option>`
            ).join('') + '<option value="nuevo">+ Agregar nuevo tipo</option>';
            select.value = nuevoTipo.trim();
        }
    },

    async mostrarIngresosDia(dateStr) {
        const ingresos = this.getIngresosDelDia(dateStr);
        const fecha = new Date(dateStr + 'T12:00:00');
        const titulo = fecha.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        
        document.getElementById('diaSeleccionado').textContent = titulo;
        
        if (ingresos.length === 0) {
            document.getElementById('listaIngresosDia').innerHTML = `
                <p class="empty-state">No hay ingresos este día</p>
            `;
        } else {
            document.getElementById('listaIngresosDia').innerHTML = `
                <ul class="movimientos-list">
                    ${ingresos.map(i => `
                        <li class="movimiento-item" data-id="${i.id}">
                            <div class="movimiento-icon ingreso">I</div>
                            <div class="movimiento-info">
                                <div class="movimiento-concepto">${i.tipo === 'ingreso' ? 'Ingreso' : i.tipo} - ${i.descripcion || 'Sin descripción'}</div>
                                <div class="movimiento-fecha">${FinanzasApp.formatDate(i.fecha)}</div>
                            </div>
                            <div class="movimiento-cantidad ingreso">+ ${FinanzasApp.formatCurrency(i.cantidad)}</div>
                            <div class="movimiento-actions">
                                <button class="btn-icon" onclick="Ingresos.editarIngreso('${i.id}')">✏️</button>
                                <button class="btn-icon" onclick="Ingresos.eliminarIngreso('${i.id}')">🗑️</button>
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

    registrarIngreso() {
        const fecha = document.getElementById('ingresoFecha').value;
        const cantidad = parseFloat(document.getElementById('ingresoCantidad').value);
        const tipo = document.getElementById('ingresoTipo').value;
        const descripcion = document.getElementById('ingresoDescripcion').value;
        const monederoId = document.getElementById('ingresoMonedero').value;
        const alcanciaId = document.getElementById('ingresoAlcancia').value;
        const frecuencia = document.getElementById('ingresoFrecuencia').value;

        if (!fecha || !cantidad || !monederoId) {
            FinanzasApp.showMessage('Error', 'Completa todos los campos obligatorios', 'error');
            return;
        }

        const nuevoIngreso = {
            id: Date.now().toString(),
            fecha: fecha,
            cantidad: cantidad,
            tipo: tipo,
            descripcion: descripcion,
            monederoId: monederoId,
            alcanciaId: alcanciaId || null,
            frecuencia: frecuencia
        };

        FinanzasApp.data.ingresos.push(nuevoIngreso);

        const monedero = FinanzasApp.data.monederos.find(m => m.id === monederoId);
        if (monedero) {
            monedero.saldo += cantidad;
        }

        if (alcanciaId) {
            const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
            if (alcancia) {
                alcancia.saldo += cantidad;
            }
        }

        FinanzasApp.saveData();
        
        this.actualizarVista();
        document.getElementById('formIngreso').reset();
        
        const hoy = new Date().toISOString().split('T')[0];
        document.getElementById('ingresoFecha').value = hoy;
        
        FinanzasApp.showMessage('Ingreso registrado', 'El ingreso se ha guardado correctamente', 'success');
    },

    async editarIngreso(id) {
        const ingreso = FinanzasApp.data.ingresos.find(i => i.id === id);
        if (!ingreso) return;
        
        const nuevaCantidad = await FinanzasApp.showPrompt('Editar ingreso', 'Nueva cantidad:', 'number', ingreso.cantidad.toString());
        if (nuevaCantidad) {
            const cantidad = parseFloat(nuevaCantidad);
            if (cantidad > 0) {
                const monederoViejo = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                if (monederoViejo) {
                    monederoViejo.saldo -= ingreso.cantidad;
                }
                
                if (ingreso.alcanciaId) {
                    const alcanciaVieja = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcanciaVieja) {
                        alcanciaVieja.saldo -= ingreso.cantidad;
                    }
                }
                
                ingreso.cantidad = cantidad;
                
                const monederoNuevo = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                if (monederoNuevo) {
                    monederoNuevo.saldo += cantidad;
                }
                
                if (ingreso.alcanciaId) {
                    const alcanciaNueva = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcanciaNueva) {
                        alcanciaNueva.saldo += cantidad;
                    }
                }
                
                FinanzasApp.saveData();
                this.actualizarVista();
                FinanzasApp.showMessage('Ingreso actualizado', 'La cantidad se ha modificado correctamente', 'success');
            }
        }
    },

    async eliminarIngreso(id) {
        const confirmar = await FinanzasApp.showConfirm('Eliminar ingreso', '¿Estás seguro de eliminar este ingreso?');
        if (confirmar) {
            const ingreso = FinanzasApp.data.ingresos.find(i => i.id === id);
            if (ingreso) {
                const monedero = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                if (monedero) {
                    monedero.saldo -= ingreso.cantidad;
                }
                
                if (ingreso.alcanciaId) {
                    const alcancia = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcancia) {
                        alcancia.saldo -= ingreso.cantidad;
                    }
                }
                
                FinanzasApp.data.ingresos = FinanzasApp.data.ingresos.filter(i => i.id !== id);
                FinanzasApp.saveData();
                this.actualizarVista();
                FinanzasApp.showMessage('Ingreso eliminado', 'El ingreso se ha eliminado correctamente', 'success');
            }
        }
    },

    actualizarVista() {
        FinanzasApp.renderView('ingresos');
    }
};

window.Ingresos = Ingresos;
