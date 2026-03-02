const Monedero = {
    render() {
        return `
            <div class="monedero-view">
                <div class="card">
                    <h3 class="section-title">Mis monederos</h3>
                    <button class="btn btn-primary" id="nuevoMonedero">+ Nuevo monedero</button>
                </div>

                <div class="card">
                    <h3 class="section-title">Mis tarjetas</h3>
                    <button class="btn btn-primary" id="nuevaTarjeta">+ Nueva tarjeta</button>
                </div>

                <div class="card">
                    <h3 class="section-title">Total general</h3>
                    <div class="resumen-value balance" id="totalGeneralMonedero">
                        ${this.calcularTotalGeneral()}
                    </div>
                </div>

                <div id="listaMonederos">
                    <h4 class="section-subtitle">Monederos</h4>
                    ${this.renderMonederos()}
                </div>

                <div id="listaTarjetas">
                    <h4 class="section-subtitle">Tarjetas</h4>
                    ${this.renderTarjetas()}
                </div>
            </div>
        `;
    },

    calcularTotalGeneral() {
        const totalMonederos = FinanzasApp.data.monederos.reduce((sum, m) => sum + (m.saldo || 0), 0);
        const totalTarjetas = FinanzasApp.data.tarjetas.reduce((sum, t) => sum + (t.saldo || 0), 0);
        const totalAlcancia = FinanzasApp.data.alcancias.reduce((sum, a) => sum + (a.saldo || 0), 0);
        return FinanzasApp.formatCurrency(totalMonederos + totalTarjetas + totalAlcancia);
    },

    renderMonederos() {
        const monederos = FinanzasApp.data.monederos;
        
        if (!monederos || monederos.length === 0) {
            return '<p class="empty-state">No hay monederos creados.</p>';
        }

        return monederos.map(m => `
            <div class="card" data-monedero-id="${m.id}">
                <div class="monedero-header">
                    <h4>
                        ${m.tipo === 'principal' ? 'Mi monedero' : m.nombre}
                    </h4>
                    <span class="monedero-saldo">${FinanzasApp.formatCurrency(m.saldo)}</span>
                </div>
                
                <div class="monedero-actions">
                    <button class="btn btn-secondary" onclick="Monedero.mostrarTransferencia('${m.id}', 'monedero')">Transferir</button>
                    <button class="btn btn-secondary" onclick="Monedero.editarMonedero('${m.id}')">Editar</button>
                    ${m.tipo !== 'principal' ? `
                        <button class="btn btn-secondary" onclick="Monedero.eliminarMonedero('${m.id}')">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    renderTarjetas() {
        if (!FinanzasApp.data.tarjetas) {
            FinanzasApp.data.tarjetas = [];
        }
        
        const tarjetas = FinanzasApp.data.tarjetas;
        
        if (tarjetas.length === 0) {
            return '<p class="empty-state">No hay tarjetas creadas.</p>';
        }

        return tarjetas.map(t => `
            <div class="card" data-tarjeta-id="${t.id}">
                <div class="monedero-header">
                    <h4>
                        ${t.nombre}
                        ${t.tipo === 'principal' ? '<span class="text-secondary">(Principal)</span>' : ''}
                    </h4>
                    <span class="monedero-saldo">${FinanzasApp.formatCurrency(t.saldo)}</span>
                </div>
                
                <div class="monedero-actions">
                    <button class="btn btn-secondary" onclick="Monedero.mostrarTransferencia('${t.id}', 'tarjeta')">Transferir</button>
                    <button class="btn btn-secondary" onclick="Monedero.editarTarjeta('${t.id}')">Editar</button>
                    ${t.tipo !== 'principal' ? `
                        <button class="btn btn-secondary" onclick="Monedero.eliminarTarjeta('${t.id}')">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
    },

    init() {
        document.getElementById('nuevoMonedero').addEventListener('click', () => {
            this.mostrarFormNuevoMonedero();
        });
        document.getElementById('nuevaTarjeta').addEventListener('click', () => {
            this.mostrarFormNuevaTarjeta();
        });
    },

    async mostrarFormNuevoMonedero() {
        const nombre = await FinanzasApp.showPrompt('Nuevo monedero', 'Nombre del monedero:', 'text');
        if (nombre && nombre.trim()) {
            FinanzasApp.data.monederos.push({
                id: 'm' + Date.now().toString(),
                nombre: nombre.trim(),
                saldo: 0,
                tipo: 'secundario'
            });
            await FinanzasApp.showMessage('Monedero creado', `El monedero "${nombre}" se ha creado correctamente.`, 'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        }
    },

    async mostrarFormNuevaTarjeta() {
        const nombre = await FinanzasApp.showPrompt('Nueva tarjeta', 'Nombre de la tarjeta:', 'text');
        if (nombre && nombre.trim()) {
            FinanzasApp.data.tarjetas.push({
                id: 't' + Date.now().toString(),
                nombre: nombre.trim(),
                saldo: 0,
                tipo: 'secundario'
            });
            await FinanzasApp.showMessage('Tarjeta creada', `La tarjeta "${nombre}" se ha creado correctamente.`, 'success');
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

    async editarTarjeta(id) {
        const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === id);
        if (!tarjeta) return;
        
        const nuevoNombre = await FinanzasApp.showPrompt('Editar tarjeta', 'Nuevo nombre:', 'text', tarjeta.nombre);
        if (nuevoNombre && nuevoNombre.trim() && nuevoNombre !== tarjeta.nombre) {
            tarjeta.nombre = nuevoNombre.trim();
            await FinanzasApp.showMessage('Nombre actualizado', 'El nombre de la tarjeta se ha actualizado correctamente.', 'success');
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

    async eliminarTarjeta(id) {
        const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === id);
        if (!tarjeta) return;
        
        if (tarjeta.saldo > 0) {
            const confirmar = await FinanzasApp.showConfirm('Eliminar tarjeta', 
                `La tarjeta tiene ${FinanzasApp.formatCurrency(tarjeta.saldo)}.\n\n¿Estás seguro de eliminarla? El dinero se perderá.`);
            if (!confirmar) return;
        } else {
            const confirmar = await FinanzasApp.showConfirm('Eliminar tarjeta', 
                `¿Estás seguro de eliminar la tarjeta "${tarjeta.nombre}"?`);
            if (!confirmar) return;
        }
        
        FinanzasApp.data.tarjetas = FinanzasApp.data.tarjetas.filter(t => t.id !== id);
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async mostrarTransferencia(origenId, tipoOrigen) {
        // Recopilar todos los destinos posibles
        const destinos = [];
        
        FinanzasApp.data.monederos.forEach(m => {
            if (!(tipoOrigen === 'monedero' && m.id === origenId)) {
                destinos.push({
                    id: m.id,
                    tipo: 'monedero',
                    nombre: m.tipo === 'principal' ? 'Mi monedero' : m.nombre,
                    saldo: m.saldo
                });
            }
        });
        
        FinanzasApp.data.tarjetas.forEach(t => {
            if (!(tipoOrigen === 'tarjeta' && t.id === origenId)) {
                destinos.push({
                    id: t.id,
                    tipo: 'tarjeta',
                    nombre: t.nombre,
                    saldo: t.saldo
                });
            }
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
        
        const origen = tipoOrigen === 'monedero' 
            ? FinanzasApp.data.monederos.find(m => m.id === origenId)
            : FinanzasApp.data.tarjetas.find(t => t.id === origenId);
        
        if (!origen) return;
        
        // Crear opciones para el select usando índices
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
            
            // Sumar al destino según su tipo
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
                `Se han transferido ${FinanzasApp.formatCurrency(cantidad)}.`, 
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