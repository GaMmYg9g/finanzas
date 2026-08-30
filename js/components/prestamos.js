const Prestamos = {
    render() {
        return `
            <div class="prestamos-view">
                <div class="card">
                    <h3 class="section-title"><i class="fas fa-handshake"></i> Nuevo préstamo</h3>
                    <form id="formPrestamo">
                        <div class="form-group">
                            <label class="form-label"><i class="fas fa-tag"></i> Nombre del préstamo</label>
                            <input type="text" class="form-input" id="prestamoNombre" placeholder="Ej: Préstamo a Juan" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label"><i class="fas fa-dollar-sign"></i> Monto total</label>
                            <input type="number" step="0.01" class="form-input" id="prestamoMonto" required>
                        </div>
                        <div class="form-group">
                            <label class="form-label"><i class="far fa-calendar-alt"></i> Fecha límite (opcional)</label>
                            <div class="fecha-selector">
                                <button type="button" class="fecha-btn" id="btnFechaPrestamo">
                                    <span class="fecha-icono"><i class="fas fa-calendar-day"></i></span>
                                    <span class="fecha-texto" id="fechaPrestamoTexto">Seleccionar</span>
                                </button>
                                <input type="hidden" id="fechaPrestamoValor">
                            </div>
                        </div>
                        
                        <div class="destino-group">
                            <div class="destino-titulo"><i class="fas fa-arrow-left"></i> Origen del dinero prestado</div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="origenPrestamo" value="monedero" class="destino-radio" id="origenPrestamoMonedero">
                                <label for="origenPrestamoMonedero"><i class="fas fa-wallet"></i> Monedero</label>
                                <select class="destino-select" id="prestamoMonedero" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.monederos.map(m => `<option value="${m.id}">${m.nombre} (${FinanzasApp.formatCurrency(m.saldo)})</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="origenPrestamo" value="tarjeta" class="destino-radio" id="origenPrestamoTarjeta">
                                <label for="origenPrestamoTarjeta"><i class="fas fa-credit-card"></i> Tarjeta</label>
                                <select class="destino-select" id="prestamoTarjeta" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.tarjetas.map(t => `<option value="${t.id}">${t.nombre} (${FinanzasApp.formatCurrency(t.saldo)})</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="origenPrestamo" value="alcancia" class="destino-radio" id="origenPrestamoAlcancia">
                                <label for="origenPrestamoAlcancia"><i class="fas fa-piggy-bank"></i> Alcancía</label>
                                <select class="destino-select" id="prestamoAlcancia" disabled>
                                    <option value="">Seleccionar</option>
                                    ${FinanzasApp.data.alcancias.map(a => `<option value="${a.id}">${a.nombre} (${FinanzasApp.formatCurrency(a.saldo)})</option>`).join('')}
                                </select>
                            </div>
                            
                            <div class="destino-opcion">
                                <input type="radio" name="origenPrestamo" value="ingreso" class="destino-radio" id="origenPrestamoIngreso">
                                <label for="origenPrestamoIngreso"><i class="fas fa-arrow-down"></i> Ingreso (dinero nuevo)</label>
                            </div>
                        </div>
                        
                        <button type="submit" class="btn btn-primary"><i class="fas fa-plus-circle"></i> Crear préstamo</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="section-title"><i class="fas fa-list"></i> Mis préstamos</h3>
                    <div id="listaPrestamos">${this.renderPrestamos()}</div>
                </div>

                <div class="modal" id="pagoPrestamoModal" style="display:none">
                    <div class="modal-content">
                        <h3 class="modal-title"><i class="fas fa-hand-holding-usd"></i> Registrar pago</h3>
                        <div id="pagoPrestamoContenido"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderPrestamos() {
        const prestamos = FinanzasApp.data.prestamos || [];
        if (!prestamos.length) return '<p class="empty-state"><i class="fas fa-info-circle"></i> No hay préstamos</p>';
        
        return prestamos.map(p => {
            const progreso = ((p.montoRecuperado || 0) / p.montoTotal) * 100;
            const pendiente = p.montoTotal - (p.montoRecuperado || 0);
            return `
                <div class="prestamo-item card">
                    <div class="prestamo-header">
                        <h4><i class="fas fa-handshake"></i> ${p.nombre}</h4>
                        <span class="prestamo-estado ${p.estado}">${p.estado === 'activo' ? 'Activo' : 'Finalizado'}</span>
                    </div>
                    <div class="prestamo-montos">
                        <span><i class="fas fa-check-circle" style="color:var(--success-color);"></i> Recuperado: ${FinanzasApp.formatCurrency(p.montoRecuperado || 0)}</span>
                        <span><i class="fas fa-coins"></i> Total: ${FinanzasApp.formatCurrency(p.montoTotal)}</span>
                    </div>
                    <div class="prestamo-pendiente">
                        <i class="fas fa-exclamation-triangle" style="color:#9c27b0;"></i> Pendiente: ${FinanzasApp.formatCurrency(pendiente)}
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar"><div class="progress-fill" style="width:${progreso}%"></div></div>
                        <span class="progress-porcentaje">${progreso.toFixed(0)}%</span>
                    </div>
                    <div class="prestamo-origen">
                        <small><i class="fas fa-arrow-left"></i> Origen: ${p.origen.tipo} - ${p.origen.nombre}</small>
                    </div>
                    ${p.fechaLimite ? `<div class="prestamo-fechaLimite"><i class="far fa-calendar-alt"></i> Límite: ${FinanzasApp.formatDate(p.fechaLimite)}</div>` : ''}
                    <div class="prestamo-actions">
                        ${p.estado === 'activo' ? `
                            <button class="btn btn-secondary" onclick="Prestamos.mostrarPago('${p.id}')"><i class="fas fa-hand-holding-usd"></i> Registrar pago</button>
                        ` : ''}
                        <button class="btn btn-secondary" onclick="Prestamos.verDetalle('${p.id}')"><i class="fas fa-info-circle"></i> Detalle</button>
                        ${p.estado === 'activo' && pendiente === 0 ? `
                            <button class="btn btn-secondary" onclick="Prestamos.finalizarPrestamo('${p.id}')"><i class="fas fa-check"></i> Finalizar</button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    init() {
        const form = document.getElementById('formPrestamo');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.crearPrestamo(); });
        
        document.querySelectorAll('input[name="origenPrestamo"]').forEach(radio => {
            radio.addEventListener('change', (e) => {
                this.actualizarOrigen(e.target.value);
            });
        });
        
        const btnFecha = document.getElementById('btnFechaPrestamo');
        if (btnFecha) {
            btnFecha.addEventListener('click', async () => {
                const f = await FinanzasApp.mostrarSelectorFecha();
                if (f) {
                    document.getElementById('fechaPrestamoValor').value = f;
                    document.getElementById('fechaPrestamoTexto').textContent = FinanzasApp.formatDate(f);
                }
            });
        }
    },

    actualizarOrigen(seleccion) {
        document.querySelectorAll('#formPrestamo .destino-select').forEach(select => {
            select.disabled = true;
            select.style.opacity = '0.5';
        });
        
        if (seleccion === 'monedero') {
            document.getElementById('prestamoMonedero').disabled = false;
            document.getElementById('prestamoMonedero').style.opacity = '1';
        } else if (seleccion === 'tarjeta') {
            document.getElementById('prestamoTarjeta').disabled = false;
            document.getElementById('prestamoTarjeta').style.opacity = '1';
        } else if (seleccion === 'alcancia') {
            document.getElementById('prestamoAlcancia').disabled = false;
            document.getElementById('prestamoAlcancia').style.opacity = '1';
        }
    },

    async crearPrestamo() {
        const nombre = document.getElementById('prestamoNombre')?.value;
        const monto = parseFloat(document.getElementById('prestamoMonto')?.value);
        const fechaLimite = document.getElementById('fechaPrestamoValor')?.value;
        const origenSeleccionado = document.querySelector('input[name="origenPrestamo"]:checked')?.value;
        
        if (!nombre || !monto || !origenSeleccionado) {
            FinanzasApp.showMessage('Error', 'Completa todos los campos', 'error');
            return;
        }
        
        let origenInfo = { tipo: origenSeleccionado, id: null, nombre: '' };
        
        if (origenSeleccionado === 'monedero') {
            const id = document.getElementById('prestamoMonedero')?.value;
            if (!id) return FinanzasApp.showMessage('Error', 'Selecciona un monedero', 'error');
            
            const monedero = FinanzasApp.data.monederos.find(m => m.id === id);
            if (!monedero || monedero.saldo < monto) {
                return FinanzasApp.showMessage('Error', 'Saldo insuficiente', 'error');
            }
            monedero.saldo -= monto;
            origenInfo = { tipo: 'monedero', id, nombre: monedero.nombre };
            
        } else if (origenSeleccionado === 'tarjeta') {
            const id = document.getElementById('prestamoTarjeta')?.value;
            if (!id) return FinanzasApp.showMessage('Error', 'Selecciona una tarjeta', 'error');
            
            const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === id);
            if (!tarjeta || tarjeta.saldo < monto) {
                return FinanzasApp.showMessage('Error', 'Saldo insuficiente', 'error');
            }
            tarjeta.saldo -= monto;
            origenInfo = { tipo: 'tarjeta', id, nombre: tarjeta.nombre };
            
        } else if (origenSeleccionado === 'alcancia') {
            const id = document.getElementById('prestamoAlcancia')?.value;
            if (!id) return FinanzasApp.showMessage('Error', 'Selecciona una alcancía', 'error');
            
            const alcancia = FinanzasApp.data.alcancias.find(a => a.id === id);
            if (!alcancia || alcancia.saldo < monto) {
                return FinanzasApp.showMessage('Error', 'Saldo insuficiente', 'error');
            }
            alcancia.saldo -= monto;
            origenInfo = { tipo: 'alcancia', id, nombre: alcancia.nombre };
            
        } else if (origenSeleccionado === 'ingreso') {
            origenInfo = { tipo: 'ingreso', id: null, nombre: 'Dinero nuevo' };
        }
        
        FinanzasApp.data.prestamos = FinanzasApp.data.prestamos || [];
        FinanzasApp.data.prestamos.push({
            id: Date.now().toString(),
            nombre,
            montoTotal: monto,
            montoRecuperado: 0,
            estado: 'activo',
            fechaCreacion: new Date().toISOString().split('T')[0],
            fechaLimite: fechaLimite || null,
            origen: origenInfo,
            pagos: []
        });
        
        FinanzasApp.saveData();
        document.getElementById('formPrestamo').reset();
        document.getElementById('fechaPrestamoTexto').textContent = 'Seleccionar';
        this.actualizarVista();
        FinanzasApp.showMessage('Préstamo creado', 'Correctamente', 'success');
    },

    async mostrarPago(id) {
        const p = FinanzasApp.data.prestamos.find(p => p.id === id);
        if (!p) return;
        
        const pendiente = p.montoTotal - (p.montoRecuperado || 0);
        
        const destinos = [
            ...FinanzasApp.data.monederos.map(m => ({ tipo: 'monedero', id: m.id, nombre: m.nombre, saldo: m.saldo })),
            ...FinanzasApp.data.tarjetas.map(t => ({ tipo: 'tarjeta', id: t.id, nombre: t.nombre, saldo: t.saldo })),
            ...FinanzasApp.data.alcancias.map(a => ({ tipo: 'alcancia', id: a.id, nombre: a.nombre, saldo: a.saldo }))
        ];
        
        const modal = document.getElementById('pagoPrestamoModal');
        const cont = document.getElementById('pagoPrestamoContenido');
        cont.innerHTML = `
            <p><i class="fas fa-handshake"></i> <strong>${p.nombre}</strong> - Pendiente: ${FinanzasApp.formatCurrency(pendiente)}</p>
            <div class="form-group">
                <label><i class="fas fa-dollar-sign"></i> Cantidad a recibir</label>
                <input type="number" class="form-input" id="pagoPrestamoCantidad" value="${pendiente}">
            </div>
            <div class="form-group">
                <label><i class="fas fa-arrow-right"></i> Destino del dinero</label>
                <select class="form-input" id="pagoPrestamoDestino">
                    <option value="">Seleccionar destino</option>
                    ${destinos.map(d => `<option value="${d.tipo}|${d.id}">${d.tipo === 'monedero' ? '💰' : d.tipo === 'tarjeta' ? '💳' : '🏦'} ${d.nombre} (${FinanzasApp.formatCurrency(d.saldo)})</option>`).join('')}
                    <option value="ingreso"><i class="fas fa-arrow-down"></i> Ingreso (dinero nuevo)</option>
                </select>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="cancelarPagoPrestamo"><i class="fas fa-times"></i> Cancelar</button>
                <button class="modal-btn confirm" id="confirmarPagoPrestamo"><i class="fas fa-check"></i> Registrar pago</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('cancelarPagoPrestamo').onclick = () => modal.style.display = 'none';
        document.getElementById('confirmarPagoPrestamo').onclick = async () => {
            const cant = parseFloat(document.getElementById('pagoPrestamoCantidad').value);
            const dest = document.getElementById('pagoPrestamoDestino').value;
            
            if (!cant || cant <= 0 || cant > pendiente) {
                return FinanzasApp.showMessage('Error', 'Cantidad no válida', 'error');
            }
            
            if (!dest) {
                return FinanzasApp.showMessage('Error', 'Selecciona un destino', 'error');
            }
            
            p.montoRecuperado = (p.montoRecuperado || 0) + cant;
            p.pagos.push({
                fecha: new Date().toISOString().split('T')[0],
                cantidad: cant,
                destino: dest
            });
            
            if (dest !== 'ingreso') {
                const [tipo, idDest] = dest.split('|');
                if (tipo === 'monedero') {
                    const m = FinanzasApp.data.monederos.find(m => m.id === idDest);
                    if (m) m.saldo += cant;
                } else if (tipo === 'tarjeta') {
                    const t = FinanzasApp.data.tarjetas.find(t => t.id === idDest);
                    if (t) t.saldo += cant;
                } else if (tipo === 'alcancia') {
                    const a = FinanzasApp.data.alcancias.find(a => a.id === idDest);
                    if (a) {
                        a.saldo += cant;
                        a.acumulado = (a.acumulado || 0) + cant;
                    }
                }
            }
            
            if (p.montoRecuperado >= p.montoTotal) {
                p.estado = 'finalizado';
            }
            
            FinanzasApp.saveData();
            modal.style.display = 'none';
            this.actualizarVista();
            FinanzasApp.showMessage('Pago registrado', `Recibiste ${FinanzasApp.formatCurrency(cant)}`, 'success');
        };
    },

    verDetalle(id) {
        const p = FinanzasApp.data.prestamos.find(p => p.id === id);
        if (!p) return;
        
        let msg = `${p.nombre}\n`;
        msg += `Total: ${FinanzasApp.formatCurrency(p.montoTotal)}\n`;
        msg += `Recuperado: ${FinanzasApp.formatCurrency(p.montoRecuperado || 0)}\n`;
        msg += `Pendiente: ${FinanzasApp.formatCurrency(p.montoTotal - (p.montoRecuperado || 0))}\n`;
        msg += `Estado: ${p.estado}\n`;
        msg += `Origen: ${p.origen.tipo} - ${p.origen.nombre}\n`;
        if (p.fechaLimite) msg += `Límite: ${FinanzasApp.formatDate(p.fechaLimite)}\n`;
        
        if (p.pagos?.length) {
            msg += '\nPagos recibidos:';
            p.pagos.forEach(pag => msg += `\n- ${FinanzasApp.formatDate(pag.fecha)}: ${FinanzasApp.formatCurrency(pag.cantidad)} (${pag.destino})`);
        }
        
        FinanzasApp.showMessage('Detalle del préstamo', msg, 'info');
    },

    finalizarPrestamo(id) {
        const p = FinanzasApp.data.prestamos.find(p => p.id === id);
        if (!p) return;
        
        p.estado = 'finalizado';
        FinanzasApp.saveData();
        this.actualizarVista();
        FinanzasApp.showMessage('Préstamo finalizado', '', 'success');
    },

    actualizarVista() {
        document.getElementById('listaPrestamos').innerHTML = this.renderPrestamos();
    }
};

window.Prestamos = Prestamos;
