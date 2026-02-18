const Alcancia = {
    render() {
        return `
            <div class="alcancia-view">
                <div class="card">
                    <h3 class="section-title">Mis alcancías</h3>
                    <button class="btn btn-primary" id="nuevaAlcancia">+ Nueva alcancía</button>
                </div>

                <div id="listaAlcancia">
                    ${this.renderAlcancia()}
                </div>
            </div>
        `;
    },

    renderAlcancia() {
        const alcancias = FinanzasApp.data.alcancias;
        
        if (alcancias.length === 0) {
            return `
                <div class="card">
                    <p class="empty-state">No hay alcancías creadas. Crea una para empezar a ahorrar.</p>
                </div>
            `;
        }

        return alcancias.map(a => `
            <div class="card" data-alcancia-id="${a.id}">
                <div class="alcancia-header">
                    <div>
                        <h4 class="alcancia-nombre">${a.nombre}</h4>
                        <span class="alcancia-subtipo">Alcancía de ahorro</span>
                    </div>
                    <div class="alcancia-total">
                        <span class="alcancia-cantidad">${FinanzasApp.formatCurrency(a.saldo)}</span>
                    </div>
                </div>
                
                <div class="alcancia-objetivos-section">
                    <div class="section-header">
                        <h5 class="section-subtitle">Objetivos</h5>
                        <span class="objetivos-count">${a.objetivos.length} ${a.objetivos.length === 1 ? 'objetivo' : 'objetivos'}</span>
                    </div>
                    
                    ${a.objetivos.length > 0 ? `
                        <div class="objetivos-list">
                            ${a.objetivos.map(o => `
                                <div class="objetivo-item">
                                    <div class="objetivo-info">
                                        <span class="objetivo-nombre">${o.nombre}</span>
                                        <span class="objetivo-meta">${FinanzasApp.formatCurrency(o.meta)}</span>
                                    </div>
                                    <div class="progress-bar">
                                        <div class="progress-fill" style="width: ${Math.min((a.saldo / o.meta) * 100, 100)}%"></div>
                                    </div>
                                    ${a.saldo >= o.meta ? '<span class="objetivo-completado">Completado</span>' : ''}
                                </div>
                            `).join('')}
                        </div>
                    ` : `
                        <p class="empty-state">No hay objetivos creados</p>
                    `}
                </div>
                
                <div class="alcancia-actions">
                    <div class="actions-group">
                        <button class="action-btn" onclick="Alcancia.mostrarFormIngreso('${a.id}')">
                            <span class="action-text">Ingresar</span>
                        </button>
                        <button class="action-btn" onclick="Alcancia.mostrarFormGasto('${a.id}')">
                            <span class="action-text">Retirar</span>
                        </button>
                        <button class="action-btn" onclick="Alcancia.mostrarFormObjetivo('${a.id}')">
                            <span class="action-text">Objetivo</span>
                        </button>
                    </div>
                    <div class="actions-group">
                        <button class="action-btn action-btn-edit" onclick="Alcancia.editarAlcancia('${a.id}')">
                            <span class="action-text">Editar</span>
                        </button>
                        <button class="action-btn action-btn-delete" onclick="Alcancia.eliminarAlcancia('${a.id}')">
                            <span class="action-text">Eliminar</span>
                        </button>
                    </div>
                </div>
            </div>
        `).join('');
    },

    init() {
        document.getElementById('nuevaAlcancia').addEventListener('click', () => {
            this.mostrarFormNuevaAlcancia();
        });
    },

    async mostrarFormNuevaAlcancia() {
        const nombre = await FinanzasApp.showPrompt('Nueva alcancía', 'Nombre de la alcancía:', 'text');
        if (nombre && nombre.trim()) {
            FinanzasApp.data.alcancias.push({
                id: Date.now().toString(),
                nombre: nombre.trim(),
                saldo: 0,
                objetivos: []
            });
            await FinanzasApp.showMessage('Alcancía creada', `La alcancía "${nombre}" se ha creado correctamente.`, 'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        }
    },

    async editarAlcancia(id) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === id);
        if (!alcancia) return;
        
        const nuevoNombre = await FinanzasApp.showPrompt('Editar alcancía', 'Nuevo nombre:', 'text', alcancia.nombre);
        if (nuevoNombre && nuevoNombre.trim() && nuevoNombre !== alcancia.nombre) {
            alcancia.nombre = nuevoNombre.trim();
            await FinanzasApp.showMessage('Nombre actualizado', 'El nombre de la alcancía se ha actualizado correctamente.', 'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        }
    },

    async eliminarAlcancia(id) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === id);
        if (!alcancia) return;
        
        if (alcancia.saldo > 0) {
            const confirmar = await FinanzasApp.showConfirm('Eliminar alcancía', 
                `La alcancía tiene ${FinanzasApp.formatCurrency(alcancia.saldo)}.\n\n¿Estás seguro de eliminarla? El dinero se perderá.`);
            if (!confirmar) return;
        } else {
            const confirmar = await FinanzasApp.showConfirm('Eliminar alcancía', 
                `¿Estás seguro de eliminar la alcancía "${alcancia.nombre}"?`);
            if (!confirmar) return;
        }
        
        FinanzasApp.data.alcancias = FinanzasApp.data.alcancias.filter(a => a.id !== id);
        
        await FinanzasApp.showMessage('Alcancía eliminada', `La alcancía se ha eliminado correctamente.`, 'success');
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async mostrarFormIngreso(alcanciaId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const cantidadStr = await FinanzasApp.showPrompt('Ingresar dinero', 'Cantidad a ingresar:', 'number');
        if (!cantidadStr) return;
        
        const cantidad = parseFloat(cantidadStr);
        if (cantidad > 0) {
            alcancia.saldo += cantidad;
            await FinanzasApp.showMessage('Dinero ingresado', 
                `Has añadido ${FinanzasApp.formatCurrency(cantidad)} a "${alcancia.nombre}".`, 
                'success');
            FinanzasApp.saveData();
            this.actualizarVista();
        } else {
            await FinanzasApp.showMessage('Cantidad inválida', 'Por favor ingresa una cantidad válida.', 'error');
        }
    },

    async mostrarFormGasto(alcanciaId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const cantidadStr = await FinanzasApp.showPrompt('Retirar dinero', 'Cantidad a retirar:', 'number');
        if (!cantidadStr) return;
        
        const cantidad = parseFloat(cantidadStr);
        if (cantidad <= 0) {
            await FinanzasApp.showMessage('Cantidad inválida', 'Por favor ingresa una cantidad válida.', 'error');
            return;
        }
        
        if (alcancia.saldo >= cantidad) {
            const justificacion = await FinanzasApp.showPrompt('Justificación', '¿Para qué retiras este dinero?', 'text');
            if (justificacion) {
                alcancia.saldo -= cantidad;
                await FinanzasApp.showMessage('Retiro realizado', 
                    `Has retirado ${FinanzasApp.formatCurrency(cantidad)} de "${alcancia.nombre}" para: ${justificacion}`, 
                    'success');
                FinanzasApp.saveData();
                this.actualizarVista();
            }
        } else {
            await FinanzasApp.showMessage('Saldo insuficiente', 
                `La alcancía tiene ${FinanzasApp.formatCurrency(alcancia.saldo)}.`, 
                'error');
        }
    },

    async mostrarFormObjetivo(alcanciaId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const nombre = await FinanzasApp.showPrompt('Nuevo objetivo', 'Nombre del objetivo:', 'text');
        if (!nombre || !nombre.trim()) return;
        
        const metaStr = await FinanzasApp.showPrompt('Meta del objetivo', 'Cantidad a alcanzar:', 'number');
        if (!metaStr) return;
        
        const meta = parseFloat(metaStr);
        if (meta <= 0) {
            await FinanzasApp.showMessage('Cantidad inválida', 'La meta debe ser mayor a 0.', 'error');
            return;
        }
        
        const acumular = await FinanzasApp.showConfirm('Acumular saldo', 
            '¿Quieres que este objetivo empiece con el saldo actual de la alcancía?');
        
        alcancia.objetivos.push({
            id: Date.now().toString(),
            nombre: nombre.trim(),
            meta: meta,
            completado: false
        });
        
        await FinanzasApp.showMessage('Objetivo creado', 
            `El objetivo "${nombre}" se ha añadido a "${alcancia.nombre}".`, 
            'success');
        
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    actualizarVista() {
        document.getElementById('listaAlcancia').innerHTML = this.renderAlcancia();
        FinanzasApp.updateTotalGeneral();
    }
};

window.Alcancia = Alcancia;
