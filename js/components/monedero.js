const Monedero = {
    render() {
        return `
            <div class="monedero-view">
                <div class="card">
                    <h3 class="section-title"><i class="fas fa-wallet"></i> Mis monederos</h3>
                    <button class="btn btn-primary" id="nuevoMonedero"><i class="fas fa-plus-circle"></i> Nuevo monedero</button>
                </div>

                <div class="card">
                    <h3 class="section-title"><i class="fas fa-calculator"></i> Total en efectivo</h3>
                    <div class="resumen-value balance" id="totalGeneralMonedero">
                        ${this.calcularTotalMonederos()}
                    </div>
                </div>

                <div id="listaMonederos">
                    <h4 class="section-subtitle"><i class="fas fa-wallet"></i> Mis monederos</h4>
                    ${this.renderMonederos()}
                </div>
            </div>
        `;
    },

    calcularTotalMonederos() {
        const total = FinanzasApp.data.monederos.reduce((sum, m) => sum + (m.saldo || 0), 0);
        return FinanzasApp.formatCurrency(total);
    },

    renderMonederos() {
        const monederos = FinanzasApp.data.monederos;
        
        if (!monederos || monederos.length === 0) {
            return '<p class="empty-state"><i class="fas fa-info-circle"></i> No hay monederos creados.</p>';
        }

        return monederos.map(m => {
            const saldoUSD = FinanzasApp.formatUSD(m.saldo);
            const esPropio = m.propio !== false;
            
            return `
                <div class="card" data-monedero-id="${m.id}">
                    <div class="monedero-header">
                        <h4>
                            <i class="fas fa-wallet"></i> ${m.tipo === 'principal' ? 'Mi monedero' : m.nombre}
                        </h4>
                        <span class="monedero-saldo">
                            ${FinanzasApp.formatCurrency(m.saldo)}
                            <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">${saldoUSD}</span>
                        </span>
                    </div>
                    
                    <div class="monedero-actions">
                        <button class="btn btn-secondary" onclick="Monedero.mostrarTransferencia('${m.id}', 'monedero')">
                            <i class="fas fa-exchange-alt"></i> Transferir
                        </button>
                        
                        <div class="switch-container">
                            <span class="switch-label ${!esPropio ? 'active' : ''}">Terceros</span>
                            <label class="switch">
                                <input type="checkbox" ${esPropio ? 'checked' : ''} onchange="Monedero.togglePropiedad('${m.id}')">
                                <span class="slider round"></span>
                            </label>
                            <span class="switch-label ${esPropio ? 'active' : ''}">Propio</span>
                        </div>
                        
                        <button class="btn btn-secondary" onclick="Monedero.editarMonedero('${m.id}')">
                            <i class="fas fa-edit"></i> Editar
                        </button>
                        ${m.tipo !== 'principal' ? `
                            <button class="btn btn-secondary" onclick="Monedero.eliminarMonedero('${m.id}')">
                                <i class="fas fa-trash-alt"></i> Eliminar
                            </button>
                        ` : ''}
                    </div>
                </div>
            `;
        }).join('');
    },

    init() {
        document.getElementById('nuevoMonedero').addEventListener('click', () => {
            this.mostrarFormNuevoMonedero();
        });
    },

    async mostrarFormNuevoMonedero() {
        const nombre = await FinanzasApp.showPrompt('Nuevo monedero', 'Nombre del monedero:', 'text');
        if (nombre && nombre.trim()) {
            FinanzasApp.data.monederos.push({
                id: 'm' + Date.now().toString(),
                nombre: nombre.trim(),
                saldo: 0,
                tipo: 'secundario',
                propio: true
            });
            await FinanzasApp.showMessage('Monedero creado', `El monedero "${nombre}" se ha creado correctamente.`, 'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        }
    },

    async editarMonedero(id) {
        const monedero = FinanzasApp.data.monederos.find(m => m.id === id);
        if (!monedero) return;
        
        const nuevoNombre = await FinanzasApp.showPrompt('Editar monedero', 'Nuevo nombre:', 'text', monedero.nombre);
        if (nuevoNombre && nuevoNombre.trim() && nuevoNombre !== monedero.nombre) {
            monedero.nombre = nuevoNombre.trim();
            await FinanzasApp.showMessage('Nombre actualizado', 'El nombre del monedero se ha actualizado correctamente.', 'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        }
    },

    async eliminarMonedero(id) {
        const monedero = FinanzasApp.data.monederos.find(m => m.id === id);
        if (!monedero) return;
        
        if (monedero.saldo > 0) {
            const confirmar = await FinanzasApp.showConfirm('Eliminar monedero', 
                `El monedero tiene ${FinanzasApp.formatCurrency(monedero.saldo)}.\n\n¿Estás seguro de eliminarlo? El dinero se perderá.`);
            if (!confirmar) return;
        } else {
            const confirmar = await FinanzasApp.showConfirm('Eliminar monedero', 
                `¿Estás seguro de eliminar el monedero "${monedero.nombre}"?`);
            if (!confirmar) return;
        }
        
        FinanzasApp.data.monederos = FinanzasApp.data.monederos.filter(m => m.id !== id);
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async togglePropiedad(id) {
        const monedero = FinanzasApp.data.monederos.find(m => m.id === id);
        if (!monedero) return;
        
        const nuevoEstado = !monedero.propio;
        const mensaje = nuevoEstado ? 'propio' : 'de terceros';
        monedero.propio = nuevoEstado;
        FinanzasApp.saveData();
        this.actualizarVista();
        FinanzasApp.updateTotalGeneral();
        FinanzasApp.showMessage(
            'Propiedad actualizada',
            `"${monedero.nombre}" ahora es ${mensaje}.`,
            'success'
        );
    },

    async mostrarTransferencia(origenId, tipoOrigen) {
        const destinos = [];
        
        FinanzasApp.data.monederos.forEach(m => {
            if (m.id !== origenId) {
                destinos.push({
                    id: m.id,
                    tipo: 'monedero',
                    nombre: m.tipo === 'principal' ? 'Mi monedero' : m.nombre,
                    saldo: m.saldo
                });
            }
        });
        
        FinanzasApp.data.tarjetas.forEach(t => {
            destinos.push({
                id: t.id,
                tipo: 'tarjeta',
                nombre: t.nombre,
                saldo: t.saldo
            });
        });
        
        FinanzasApp.data.alcancias.forEach(a => {
            destinos.push({
                id: a.id,
                tipo: 'alcancia',
                nombre: a.nombre,
                saldo: a.saldo
            });
        });
        
        if (destinos.length === 0) {
            await FinanzasApp.showMessage('No hay destinos', 'No hay otros lugares disponibles para transferir.', 'error');
            return;
        }
        
        const origen = FinanzasApp.data.monederos.find(m => m.id === origenId);
        if (!origen) return;
        
        const opciones = destinos.map((d, index) => ({
            value: index.toString(),
            label: `${d.tipo === 'monedero' ? '💰' : d.tipo === 'tarjeta' ? '💳' : '🏦'} ${d.nombre} (${FinanzasApp.formatCurrency(d.saldo)})`
        }));
        
        const indiceSeleccionado = await FinanzasApp.showSelect('Transferir', 'Selecciona destino:', opciones);
        if (indiceSeleccionado === null) return;
        
        const destino = destinos[parseInt(indiceSeleccionado)];
        
        const opcionTransferencia = await FinanzasApp.showConfirm('Transferir todo', 
            `¿Quieres transferir el saldo completo de ${FinanzasApp.formatCurrency(origen.saldo)}?\n\nSelecciona "No" para ingresar una cantidad personalizada.`);
        
        let cantidad;
        if (opcionTransferencia) {
            cantidad = origen.saldo;
        } else {
            const cantidadStr = await FinanzasApp.showPrompt('Cantidad personalizada', 
                `Cantidad a transferir (Máximo: ${FinanzasApp.formatCurrency(origen.saldo)}):`, 
                'number');
            if (!cantidadStr) return;
            cantidad = parseFloat(cantidadStr);
        }
        
        if (cantidad <= 0) {
            await FinanzasApp.showMessage('Cantidad inválida', 'La cantidad debe ser mayor a 0.', 'error');
            return;
        }
        
        if (origen.saldo >= cantidad) {
            origen.saldo -= cantidad;
            
            if (destino.tipo === 'monedero') {
                const dest = FinanzasApp.data.monederos.find(m => m.id === destino.id);
                if (dest) dest.saldo += cantidad;
            } else if (destino.tipo === 'tarjeta') {
                const dest = FinanzasApp.data.tarjetas.find(t => t.id === destino.id);
                if (dest) dest.saldo += cantidad;
            } else if (destino.tipo === 'alcancia') {
                const dest = FinanzasApp.data.alcancias.find(a => a.id === destino.id);
                if (dest) dest.saldo += cantidad;
            }
            
            FinanzasApp.saveData();
            await FinanzasApp.showMessage('Transferencia completada', 
                `Se han transferido ${FinanzasApp.formatCurrency(cantidad)} de "${origen.nombre}" a "${destino.nombre}".`, 
                'success');
            this.actualizarVista();
        } else {
            await FinanzasApp.showMessage('Saldo insuficiente', 
                `El origen tiene ${FinanzasApp.formatCurrency(origen.saldo)}.`, 
                'error');
        }
    },

    actualizarVista() {
        FinanzasApp.renderView('monedero');
    }
};

window.Monedero = Monedero;
