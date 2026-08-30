const Deudas = {
    render() {
        return `
            <div class="deudas-view">
                <div class="card">
                    <h3 class="section-title">Nueva deuda</h3>
                    <form id="formDeuda">
                        <div class="form-group">
                            <label class="form-label">Nombre</label>
                            <input type="text" class="form-input" id="deudaNombre" placeholder="Ej: Préstamo coche">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Monto total</label>
                            <input type="number" step="0.01" class="form-input" id="deudaMonto">
                        </div>
                        <div class="form-group">
                            <label class="form-label">Fecha límite (opcional)</label>
                            <div class="fecha-selector">
                                <button type="button" class="fecha-btn" id="btnFechaLimite">
                                    <span class="fecha-icono">📅</span>
                                    <span class="fecha-texto" id="fechaLimiteTexto">Seleccionar</span>
                                </button>
                                <input type="hidden" id="fechaLimiteValor">
                            </div>
                        </div>
                        <button type="submit" class="btn btn-primary">Crear deuda</button>
                    </form>
                </div>

                <div class="card">
                    <h3 class="section-title">Mis deudas</h3>
                    <div id="listaDeudas">${this.renderDeudas()}</div>
                </div>

                <div class="modal" id="pagoDeudaModal" style="display:none">
                    <div class="modal-content">
                        <h3 class="modal-title" id="pagoDeudaTitulo">Pagar deuda</h3>
                        <div id="pagoDeudaContenido"></div>
                    </div>
                </div>
            </div>
        `;
    },

    renderDeudas() {
        const deudas = FinanzasApp.data.deudas || [];
        if (!deudas.length) return '<p class="empty-state">No hay deudas</p>';
        
        return deudas.map(d => {
            const progreso = ((d.montoPagado || 0) / d.montoTotal) * 100;
            return `
                <div class="deuda-item card">
                    <div class="deuda-header">
                        <h4>${d.nombre}</h4>
                        <span class="deuda-estado ${d.estado}">${d.estado}</span>
                    </div>
                    <div class="deuda-montos">
                        <span>Pagado: ${FinanzasApp.formatCurrency(d.montoPagado || 0)}</span>
                        <span>Total: ${FinanzasApp.formatCurrency(d.montoTotal)}</span>
                    </div>
                    <div class="deuda-pendiente">
                        <span>Pendiente: ${FinanzasApp.formatCurrency(d.montoTotal - (d.montoPagado || 0))}</span>
                    </div>
                    <div class="progress-container">
                        <div class="progress-bar"><div class="progress-fill" style="width:${progreso}%"></div></div>
                        <span class="progress-porcentaje">${progreso.toFixed(0)}%</span>
                    </div>
                    ${d.fechaLimite ? `<div class="deuda-fechaLimite">📅 Límite: ${FinanzasApp.formatDate(d.fechaLimite)}</div>` : ''}
                    <div class="deuda-actions">
                        <button class="btn btn-secondary" onclick="Deudas.mostrarPago('${d.id}')">Pagar</button>
                        <button class="btn btn-secondary" onclick="Deudas.verDetalle('${d.id}')">Detalle</button>
                        ${d.estado !== 'pagada' ? `<button class="btn btn-secondary" onclick="Deudas.eliminarDeuda('${d.id}')">Eliminar</button>` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    init() {
        const form = document.getElementById('formDeuda');
        if (form) form.addEventListener('submit', (e) => { e.preventDefault(); this.crearDeuda(); });
        
        const btn = document.getElementById('btnFechaLimite');
        if (btn) {
            btn.addEventListener('click', async () => {
                const f = await FinanzasApp.mostrarSelectorFecha();
                if (f) {
                    document.getElementById('fechaLimiteValor').value = f;
                    document.getElementById('fechaLimiteTexto').textContent = FinanzasApp.formatDate(f);
                }
            });
        }
    },

    async crearDeuda() {
        const nombre = document.getElementById('deudaNombre')?.value;
        const monto = parseFloat(document.getElementById('deudaMonto')?.value);
        if (!nombre || !monto) return FinanzasApp.showMessage('Error', 'Completa los campos', 'error');
        
        FinanzasApp.data.deudas.push({
            id: Date.now().toString(),
            nombre,
            montoTotal: monto,
            montoPagado: 0,
            estado: 'activa',
            fechaCreacion: new Date().toISOString().split('T')[0],
            fechaLimite: document.getElementById('fechaLimiteValor')?.value || null,
            pagos: []
        });
        
        FinanzasApp.saveData();
        document.getElementById('formDeuda').reset();
        document.getElementById('fechaLimiteTexto').textContent = 'Seleccionar';
        this.actualizarVista();
        FinanzasApp.showMessage('Deuda creada', 'Correctamente', 'success');
    },

    async mostrarPago(id) {
        const d = FinanzasApp.data.deudas.find(d => d.id === id);
        if (!d) return;
        
        const origenes = [
            ...FinanzasApp.data.monederos.filter(m => m.saldo > 0).map(m => ({ tipo: 'monedero', id: m.id, nombre: m.nombre, saldo: m.saldo })),
            ...FinanzasApp.data.tarjetas.filter(t => t.saldo > 0).map(t => ({ tipo: 'tarjeta', id: t.id, nombre: t.nombre, saldo: t.saldo })),
            ...FinanzasApp.data.alcancias.filter(a => a.saldo > 0).map(a => ({ tipo: 'alcancia', id: a.id, nombre: a.nombre, saldo: a.saldo }))
        ];
        
        const modal = document.getElementById('pagoDeudaModal');
        const cont = document.getElementById('pagoDeudaContenido');
        cont.innerHTML = `
            <p><strong>${d.nombre}</strong> - Pendiente: ${FinanzasApp.formatCurrency(d.montoTotal - (d.montoPagado || 0))}</p>
            <div class="form-group">
                <label>Cantidad</label>
                <input type="number" class="form-input" id="pagoCantidad" value="${d.montoTotal - (d.montoPagado || 0)}">
            </div>
            <div class="form-group">
                <label>Origen</label>
                <select class="form-input" id="pagoOrigen">
                    <option value="">Seleccionar</option>
                    ${origenes.map(o => `<option value="${o.tipo}|${o.id}">${o.tipo}: ${o.nombre} (${FinanzasApp.formatCurrency(o.saldo)})</option>`).join('')}
                </select>
            </div>
            <div class="modal-buttons">
                <button class="modal-btn cancel" id="cancelarPago">Cancelar</button>
                <button class="modal-btn confirm" id="confirmarPago">Pagar</button>
            </div>
        `;
        
        modal.style.display = 'flex';
        
        document.getElementById('cancelarPago').onclick = () => modal.style.display = 'none';
        document.getElementById('confirmarPago').onclick = async () => {
            const cant = parseFloat(document.getElementById('pagoCantidad').value);
            const orig = document.getElementById('pagoOrigen').value;
            if (!cant || cant <= 0 || !orig) return FinanzasApp.showMessage('Error', 'Datos inválidos', 'error');
            
            const [tipo, idOri] = orig.split('|');
            let obj;
            if (tipo === 'monedero') obj = FinanzasApp.data.monederos.find(m => m.id === idOri);
            else if (tipo === 'tarjeta') obj = FinanzasApp.data.tarjetas.find(t => t.id === idOri);
            else obj = FinanzasApp.data.alcancias.find(a => a.id === idOri);
            
            if (!obj || obj.saldo < cant) return FinanzasApp.showMessage('Saldo insuficiente', '', 'error');
            
            obj.saldo -= cant;
            d.montoPagado = (d.montoPagado || 0) + cant;
            d.pagos.push({ fecha: new Date().toISOString().split('T')[0], cantidad: cant, origen: tipo });
            if (d.montoPagado >= d.montoTotal) d.estado = 'pagada';
            
            FinanzasApp.saveData();
            modal.style.display = 'none';
            this.actualizarVista();
            FinanzasApp.showMessage('Pago realizado', `Pagaste ${FinanzasApp.formatCurrency(cant)}`, 'success');
        };
    },

    verDetalle(id) {
        const d = FinanzasApp.data.deudas.find(d => d.id === id);
        if (!d) return;
        
        let msg = `${d.nombre}\nTotal: ${FinanzasApp.formatCurrency(d.montoTotal)}\nPagado: ${FinanzasApp.formatCurrency(d.montoPagado || 0)}\nPendiente: ${FinanzasApp.formatCurrency(d.montoTotal - (d.montoPagado || 0))}\nEstado: ${d.estado}`;
        if (d.fechaLimite) msg += `\nLímite: ${FinanzasApp.formatDate(d.fechaLimite)}`;
        if (d.pagos?.length) {
            msg += '\n\nPagos:';
            d.pagos.forEach(p => msg += `\n- ${FinanzasApp.formatDate(p.fecha)}: ${FinanzasApp.formatCurrency(p.cantidad)} (${p.origen})`);
        }
        FinanzasApp.showMessage('Detalle de deuda', msg, 'info');
    },

    async eliminarDeuda(id) {
        if (!await FinanzasApp.showConfirm('Eliminar deuda', '¿Seguro?')) return;
        FinanzasApp.data.deudas = FinanzasApp.data.deudas.filter(d => d.id !== id);
        FinanzasApp.saveData();
        this.actualizarVista();
        FinanzasApp.showMessage('Deuda eliminada', '', 'success');
    },

    actualizarVista() {
        document.getElementById('listaDeudas').innerHTML = this.renderDeudas();
    }
};

window.Deudas = Deudas;
