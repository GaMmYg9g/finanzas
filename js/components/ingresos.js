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
                            <select class="form-input select-limpio" id="ingresoTipo">
                                <option value="">Seleccionar tipo</option>
                                ${FinanzasApp.data.config.tiposIngreso.map(t => `<option value="${t}">${t}</option>`).join('')}
                                <option value="nuevo">+ Agregar nuevo tipo</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Método de pago</label>
                            <select class="form-input select-limpio" id="ingresoMetodo">
                                <option value="">Seleccionar método</option>
                                ${FinanzasApp.data.config.metodosPago.map(m => `<option value="${m}">${m}</option>`).join('')}
                                <option value="nuevo">+ Agregar nuevo método</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label class="form-label">Descripción (opcional)</label>
                            <input type="text" class="form-input" id="ingresoDescripcion" placeholder="Descripción del ingreso">
                        </div>
                        
                        <div class="destino-group">
                            <div class="destino-titulo">Destino del ingreso (selecciona uno)</div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="destinoIngreso" id="destinoMonedero" value="monedero" class="destino-radio">
                                <label for="destinoMonedero" class="destino-label">Monedero</label>
                                <select class="destino-select" id="ingresoMonedero" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.monederos.map(m => `<option value="${m.id}">${m.nombre}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="destinoIngreso" id="destinoTarjeta" value="tarjeta" class="destino-radio">
                                <label for="destinoTarjeta" class="destino-label">Tarjeta</label>
                                <select class="destino-select" id="ingresoTarjeta" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.tarjetas.map(t => `<option value="${t.id}">${t.nombre}</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="destinoIngreso" id="destinoAlcancia" value="alcancia" class="destino-radio">
                                <label for="destinoAlcancia" class="destino-label">Alcancía</label>
                                <select class="destino-select" id="ingresoAlcancia" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.alcancias.map(a => `<option value="${a.id}">${a.nombre}</option>`).join('')}
                                </select>
                            </div>
                        </div>
                        
                        <div class="form-group">
                            <label class="form-label">Frecuencia</label>
                            <select class="form-input select-limpio" id="ingresoFrecuencia">
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

        document.getElementById('ingresoMetodo').addEventListener('change', (e) => {
            if (e.target.value === 'nuevo') {
                this.agregarNuevoMetodo();
            }
        });

        // Event listeners para los radio buttons
        document.querySelectorAll('input[name="destinoIngreso"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.actualizarDestinos(e.target.value);
            });
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

    actualizarDestinos(seleccion) {
        // Deshabilitar todos los selects
        document.querySelectorAll('.destino-select').forEach(select => {
            select.disabled = true;
            select.style.opacity = '0.5';
        });
        
        // Habilitar el select correspondiente
        if (seleccion === 'monedero') {
            document.getElementById('ingresoMonedero').disabled = false;
            document.getElementById('ingresoMonedero').style.opacity = '1';
        } else if (seleccion === 'tarjeta') {
            document.getElementById('ingresoTarjeta').disabled = false;
            document.getElementById('ingresoTarjeta').style.opacity = '1';
        } else if (seleccion === 'alcancia') {
            document.getElementById('ingresoAlcancia').disabled = false;
            document.getElementById('ingresoAlcancia').style.opacity = '1';
        }
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
            select.innerHTML = '<option value="">Seleccionar tipo</option>' + 
                FinanzasApp.data.config.tiposIngreso.map(t => 
                    `<option value="${t}">${t}</option>`
                ).join('') + '<option value="nuevo">+ Agregar nuevo tipo</option>';
            select.value = nuevoTipo.trim();
        }
    },

    async agregarNuevoMetodo() {
        const nuevoMetodo = await FinanzasApp.showPrompt('Nuevo método de pago', 'Nombre:', 'text');
        if (nuevoMetodo && nuevoMetodo.trim()) {
            FinanzasApp.data.config.metodosPago.push(nuevoMetodo.trim());
            FinanzasApp.saveData();
            
            const select = document.getElementById('ingresoMetodo');
            select.innerHTML = '<option value="">Seleccionar método</option>' + 
                FinanzasApp.data.config.metodosPago.map(m => 
                    `<option value="${m}">${m}</option>`
                ).join('') + '<option value="nuevo">+ Agregar nuevo método</option>';
            select.value = nuevoMetodo.trim();
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
                                <div class="movimiento-concepto">${i.tipo} - ${i.descripcion || 'Sin descripción'}</div>
                                <div class="movimiento-fecha">${FinanzasApp.formatDate(i.fecha)} · ${i.metodo || 'Efectivo'}</div>
                            </div>
                            <div class="movimiento-cantidad ingreso">+ ${FinanzasApp.formatCurrency(i.cantidad)}</div>
                            <div class="movimiento-actions">
                                <button class="btn-icon" onclick="Ingresos.editarIngreso('${i.id}')">Editar</button>
                                <button class="btn-icon" onclick="Ingresos.eliminarIngreso('${i.id}')">Eliminar</button>
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
        const metodo = document.getElementById('ingresoMetodo').value;
        const descripcion = document.getElementById('ingresoDescripcion').value;
        const frecuencia = document.getElementById('ingresoFrecuencia').value;
        
        // Validar tipo y método
        if (!tipo) {
            FinanzasApp.showMessage('Error', 'Selecciona un tipo de ingreso', 'error');
            return;
        }
        
        if (!metodo) {
            FinanzasApp.showMessage('Error', 'Selecciona un método de pago', 'error');
            return;
        }
        
        // Determinar qué destino está seleccionado
        const destinoSeleccionado = document.querySelector('input[name="destinoIngreso"]:checked')?.value;
        
        if (!fecha || !cantidad) {
            FinanzasApp.showMessage('Error', 'Completa los campos obligatorios', 'error');
            return;
        }

        if (!destinoSeleccionado) {
            FinanzasApp.showMessage('Error', 'Selecciona un destino para el ingreso', 'error');
            return;
        }

        const nuevoIngreso = {
            id: Date.now().toString(),
            fecha: fecha,
            cantidad: cantidad,
            tipo: tipo,
            metodo: metodo,
            descripcion: descripcion,
            frecuencia: frecuencia
        };

        // Aplicar el ingreso al destino seleccionado
        if (destinoSeleccionado === 'monedero') {
            const monederoId = document.getElementById('ingresoMonedero').value;
            if (!monederoId) {
                FinanzasApp.showMessage('Error', 'Selecciona un monedero', 'error');
                return;
            }
            nuevoIngreso.monederoId = monederoId;
            const monedero = FinanzasApp.data.monederos.find(m => m.id === monederoId);
            if (monedero) monedero.saldo += cantidad;
            
        } else if (destinoSeleccionado === 'tarjeta') {
            const tarjetaId = document.getElementById('ingresoTarjeta').value;
            if (!tarjetaId) {
                FinanzasApp.showMessage('Error', 'Selecciona una tarjeta', 'error');
                return;
            }
            nuevoIngreso.tarjetaId = tarjetaId;
            const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === tarjetaId);
            if (tarjeta) tarjeta.saldo += cantidad;
            
        } else if (destinoSeleccionado === 'alcancia') {
            const alcanciaId = document.getElementById('ingresoAlcancia').value;
            if (!alcanciaId) {
                FinanzasApp.showMessage('Error', 'Selecciona una alcancía', 'error');
                return;
            }
            nuevoIngreso.alcanciaId = alcanciaId;
            const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
            if (alcancia) {
                alcancia.saldo += cantidad;
                alcancia.acumulado = (alcancia.acumulado || 0) + cantidad;
            }
        }

        FinanzasApp.data.ingresos.push(nuevoIngreso);
        FinanzasApp.saveData();
        
        this.actualizarVista();
        document.getElementById('formIngreso').reset();
        
        // Resetear radio buttons
        document.querySelectorAll('input[name="destinoIngreso"]').forEach(r => r.checked = false);
        this.actualizarDestinos(null);
        
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
                // Restar cantidad anterior
                if (ingreso.monederoId) {
                    const monedero = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                    if (monedero) monedero.saldo -= ingreso.cantidad;
                }
                if (ingreso.tarjetaId) {
                    const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === ingreso.tarjetaId);
                    if (tarjeta) tarjeta.saldo -= ingreso.cantidad;
                }
                if (ingreso.alcanciaId) {
                    const alcancia = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcancia) alcancia.saldo -= ingreso.cantidad;
                }
                
                ingreso.cantidad = cantidad;
                
                // Sumar nueva cantidad
                if (ingreso.monederoId) {
                    const monedero = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                    if (monedero) monedero.saldo += cantidad;
                }
                if (ingreso.tarjetaId) {
                    const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === ingreso.tarjetaId);
                    if (tarjeta) tarjeta.saldo += cantidad;
                }
                if (ingreso.alcanciaId) {
                    const alcancia = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcancia) alcancia.saldo += cantidad;
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
                // Restar de todos los destinos
                if (ingreso.monederoId) {
                    const monedero = FinanzasApp.data.monederos.find(m => m.id === ingreso.monederoId);
                    if (monedero) monedero.saldo -= ingreso.cantidad;
                }
                if (ingreso.tarjetaId) {
                    const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === ingreso.tarjetaId);
                    if (tarjeta) tarjeta.saldo -= ingreso.cantidad;
                }
                if (ingreso.alcanciaId) {
                    const alcancia = FinanzasApp.data.alcancias.find(a => a.id === ingreso.alcanciaId);
                    if (alcancia) alcancia.saldo -= ingreso.cantidad;
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
