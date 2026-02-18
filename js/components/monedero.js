const Monedero = {
    render() {
        return `
            <div class="monedero-view">
                <div class="card">
                    <h3 class="section-title">Mis monederos</h3>
                    <button class="btn btn-primary" id="nuevoMonedero">+ Nuevo monedero</button>
                </div>

                <div class="card">
                    <h3 class="section-title">Total general</h3>
                    <div class="resumen-value balance" id="totalGeneralMonedero">
                        ${this.calcularTotalGeneral()}
                    </div>
                </div>

                <div id="listaMonederos">
                    ${this.renderMonederos()}
                </div>
            </div>
        `;
    },

    calcularTotalGeneral() {
        const totalMonederos = FinanzasApp.data.monederos.reduce((sum, m) => sum + m.saldo, 0);
        const totalAlcancia = FinanzasApp.data.alcancias.reduce((sum, a) => sum + a.saldo, 0);
        return FinanzasApp.formatCurrency(totalMonederos + totalAlcancia);
    },

    renderMonederos() {
        const monederos = FinanzasApp.data.monederos;
        
        if (monederos.length === 0) {
            return `
                <div class="card">
                    <p class="empty-state">No hay monederos creados.</p>
                </div>
            `;
        }

        return monederos.map(m => `
            <div class="card" data-monedero-id="${m.id}">
                <div class="monedero-header">
                    <h4>
                        ${m.nombre}
                        ${m.tipo === 'principal' ? '<span class="text-secondary" style="font-size: 0.8rem;">(Principal)</span>' : ''}
                    </h4>
                    <span class="monedero-saldo">${FinanzasApp.formatCurrency(m.saldo)}</span>
                </div>
                
                <div class="monedero-actions">
                    <button class="btn btn-secondary" onclick="Monedero.mostrarTransferenciaMonedero('${m.id}')">A monedero</button>
                    <button class="btn btn-secondary" onclick="Monedero.mostrarTransferenciaAlcancia('${m.id}')">A alcancía</button>
                    ${m.tipo !== 'principal' ? `
                        <button class="btn btn-secondary" onclick="Monedero.editarMonedero('${m.id}')">Editar</button>
                        <button class="btn btn-secondary" onclick="Monedero.eliminarMonedero('${m.id}')">Eliminar</button>
                    ` : ''}
                </div>
            </div>
        `).join('');
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
                id: Date.now().toString(),
                nombre: nombre.trim(),
                saldo: 0,
                tipo: 'secundario'
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
        
        const ingresosAfectados = FinanzasApp.data.ingresos.filter(i => i.monederoId === id);
        const gastosAfectados = FinanzasApp.data.gastos.filter(g => g.monederoId === id);
        
        FinanzasApp.saveData();
        this.actualizarVista();
        
        if (ingresosAfectados.length > 0 || gastosAfectados.length > 0) {
            await FinanzasApp.showMessage('Movimientos afectados', 
                `${ingresosAfectados.length} ingresos y ${gastosAfectados.length} gastos usaban este monedero.\n\nPuedes editarlos para asignarlos a otro monedero.`, 
                'warning');
        }
    },

    async mostrarTransferenciaMonedero(monederoIdOrigen) {
        const monederos = FinanzasApp.data.monederos.filter(m => m.id !== monederoIdOrigen);
        if (monederos.length === 0) {
            await FinanzasApp.showMessage('No hay destinos', 'No hay otros monederos disponibles para transferir.', 'error');
            return;
        }
        
        const origen = FinanzasApp.data.monederos.find(m => m.id === monederoIdOrigen);
        
        const opciones = monederos.map(m => ({
            value: m.id,
            label: `${m.nombre} (${FinanzasApp.formatCurrency(m.saldo)})`
        }));
        
        const destinoId = await FinanzasApp.showSelect('Transferir a monedero', 'Selecciona monedero destino:', opciones);
        if (!destinoId) return;
        
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
        
        const destinoObj = FinanzasApp.data.monederos.find(m => m.id === destinoId);
        
        if (origen && destinoObj && cantidad > 0) {
            if (origen.saldo >= cantidad) {
                origen.saldo -= cantidad;
                destinoObj.saldo += cantidad;
                FinanzasApp.saveData();
                await FinanzasApp.showMessage('Transferencia completada', 
                    `Se han transferido ${FinanzasApp.formatCurrency(cantidad)} de "${origen.nombre}" a "${destinoObj.nombre}".`, 
                    'success');
                this.actualizarVista();
            } else {
                await FinanzasApp.showMessage('Saldo insuficiente', 
                    `El monedero "${origen.nombre}" tiene ${FinanzasApp.formatCurrency(origen.saldo)}.`, 
                    'error');
            }
        }
    },

    async mostrarTransferenciaAlcancia(monederoIdOrigen) {
        if (FinanzasApp.data.alcancias.length === 0) {
            await FinanzasApp.showMessage('Sin alcancías', 'No hay alcancías creadas. Crea una primero.', 'warning');
            return;
        }
        
        const origen = FinanzasApp.data.monederos.find(m => m.id === monederoIdOrigen);
        
        const opciones = FinanzasApp.data.alcancias.map(a => ({
            value: a.id,
            label: `${a.nombre} (${FinanzasApp.formatCurrency(a.saldo)})`
        }));
        
        const alcanciaId = await FinanzasApp.showSelect('Transferir a alcancía', 'Selecciona alcancía destino:', opciones);
        if (!alcanciaId) return;
        
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
        
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        
        if (origen && alcancia && cantidad > 0) {
            if (origen.saldo >= cantidad) {
                origen.saldo -= cantidad;
                alcancia.saldo += cantidad;
                FinanzasApp.saveData();
                await FinanzasApp.showMessage('Transferencia completada', 
                    `Se han transferido ${FinanzasApp.formatCurrency(cantidad)} del monedero "${origen.nombre}" a la alcancía "${alcancia.nombre}".`, 
                    'success');
                this.actualizarVista();
            } else {
                await FinanzasApp.showMessage('Saldo insuficiente', 
                    `El monedero "${origen.nombre}" tiene ${FinanzasApp.formatCurrency(origen.saldo)}.`, 
                    'error');
            }
        }
    },

    actualizarVista() {
        document.getElementById('listaMonederos').innerHTML = this.renderMonederos();
        document.getElementById('totalGeneralMonedero').textContent = this.calcularTotalGeneral();
        FinanzasApp.updateTotalGeneral();
    }
};

window.Monedero = Monedero;