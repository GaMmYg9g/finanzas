const Alcancia = {
    render() {
        return `
            <div class="alcancia-view">
                <div class="card">
                    <h3 class="section-title"><i class="fas fa-piggy-bank"></i> Mis alcancías</h3>
                    <button class="btn btn-primary" id="nuevaAlcancia"><i class="fas fa-plus-circle"></i> Nueva alcancía</button>
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
                    <p class="empty-state"><i class="fas fa-info-circle"></i> No hay alcancías creadas. Crea una para empezar a ahorrar.</p>
                </div>
            `;
        }

        return alcancias.map(a => {
            const saldoUSD = FinanzasApp.formatUSD(a.saldo);
            return `
                <div class="card" data-alcancia-id="${a.id}">
                    <div class="alcancia-header">
                        <div>
                            <h4 class="alcancia-nombre"><i class="fas fa-piggy-bank"></i> ${a.nombre}</h4>
                            <span class="alcancia-subtipo"><i class="fas fa-coins"></i> Alcancía de ahorro</span>
                        </div>
                        <div class="alcancia-total">
                            <span class="alcancia-cantidad">${FinanzasApp.formatCurrency(a.saldo)}</span>
                            <span class="alcancia-usd" style="font-size:0.9rem; color:var(--text-secondary);">${saldoUSD}</span>
                        </div>
                    </div>
                    
                    <div class="alcancia-objetivos-section">
                        <div class="section-header">
                            <h5 class="section-subtitle"><i class="fas fa-bullseye"></i> Objetivos</h5>
                            <span class="objetivos-count">${a.objetivos.length} ${a.objetivos.length === 1 ? 'objetivo' : 'objetivos'}</span>
                        </div>
                        
                        ${a.objetivos.length > 0 ? `
                            <div class="objetivos-list">
                                ${a.objetivos.map(o => {
                                    if (o.retirado) {
                                        return `
                                            <div class="objetivo-retirado-item">
                                                <div class="objetivo-retirado-header">
                                                    <span class="objetivo-retirado-nombre"><i class="fas fa-undo-alt"></i> ${o.nombre}</span>
                                                    <span class="objetivo-retirado-badge">Retirado</span>
                                                </div>
                                                <div class="objetivo-retirado-monto">
                                                    ${FinanzasApp.formatCurrency(o.meta)}
                                                </div>
                                            </div>
                                        `;
                                    }
                                    
                                    const completado = o.meta <= a.saldo;
                                    const progreso = completado ? 100 : Math.min((a.saldo / o.meta) * 100, 100);
                                    
                                    return `
                                        <div class="objetivo-item ${completado ? 'objetivo-completado-item' : ''}">
                                            <div class="objetivo-header">
                                                <span class="objetivo-nombre"><i class="fas fa-flag"></i> ${o.nombre}</span>
                                            </div>
                                            <div class="objetivo-meta">
                                                ${FinanzasApp.formatCurrency(Math.min(a.saldo, o.meta))} / ${FinanzasApp.formatCurrency(o.meta)}
                                            </div>
                                            <div class="progress-container">
                                                <div class="progress-bar">
                                                    <div class="progress-fill" style="width: ${progreso}%"></div>
                                                </div>
                                                <span class="progress-porcentaje">${progreso.toFixed(0)}%</span>
                                            </div>
                                            <div class="objetivo-actions-bottom">
                                                <button class="btn-icon-small" onclick="Alcancia.editarObjetivo('${a.id}', '${o.id}')"><i class="fas fa-edit"></i> Editar</button>
                                                <button class="btn-icon-small" onclick="Alcancia.eliminarObjetivo('${a.id}', '${o.id}')"><i class="fas fa-trash-alt"></i> Eliminar</button>
                                            </div>
                                            ${completado ? '<span class="objetivo-completado-badge"><i class="fas fa-check-circle"></i> Completado</span>' : ''}
                                        </div>
                                    `;
                                }).join('')}
                            </div>
                        ` : `
                            <p class="empty-state"><i class="fas fa-info-circle"></i> No hay objetivos creados</p>
                        `}
                    </div>
                    
                    <div class="alcancia-actions">
                        <div class="actions-group">
                            <button class="action-btn" onclick="Alcancia.mostrarFormIngreso('${a.id}')">
                                <i class="fas fa-plus-circle"></i>
                                <span class="action-text">Ingresar</span>
                            </button>
                            <button class="action-btn" onclick="Alcancia.mostrarFormGasto('${a.id}')">
                                <i class="fas fa-minus-circle"></i>
                                <span class="action-text">Retirar</span>
                            </button>
                            <button class="action-btn" onclick="Alcancia.mostrarFormObjetivo('${a.id}')">
                                <i class="fas fa-bullseye"></i>
                                <span class="action-text">Objetivo</span>
                            </button>
                        </div>
                        <div class="actions-group">
                            <button class="action-btn action-btn-stats" onclick="Alcancia.mostrarEstadisticas('${a.id}')">
                                <i class="fas fa-chart-bar"></i>
                                <span class="action-text">Estadísticas</span>
                            </button>
                            <button class="action-btn action-btn-edit" onclick="Alcancia.editarAlcancia('${a.id}')">
                                <i class="fas fa-edit"></i>
                                <span class="action-text">Editar</span>
                            </button>
                            <button class="action-btn action-btn-delete" onclick="Alcancia.eliminarAlcancia('${a.id}')">
                                <i class="fas fa-trash-alt"></i>
                                <span class="action-text">Eliminar</span>
                            </button>
                        </div>
                    </div>
                </div>
            `;
        }).join('');
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
                acumulado: 0,
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
            const opciones = [
                { value: 'monedero', label: '💰 Transferir a monedero' },
                { value: 'tarjeta', label: '💳 Transferir a tarjeta' }
            ];
            
            const otrasAlcancias = FinanzasApp.data.alcancias.filter(a => a.id !== id);
            otrasAlcancias.forEach(a => {
                opciones.push({
                    value: `alcancia:${a.id}`,
                    label: `🏦 Transferir a alcancía: ${a.nombre}`
                });
            });
            
            opciones.push({ value: 'eliminar', label: '❌ Eliminar el dinero (se perderá)' });
            opciones.push({ value: 'cancelar', label: '↩️ Cancelar' });
            
            const seleccion = await FinanzasApp.showSelect(
                '¿Qué hacer con el dinero?', 
                `La alcancía "${alcancia.nombre}" tiene ${FinanzasApp.formatCurrency(alcancia.saldo)}`,
                opciones
            );
            
            if (!seleccion || seleccion === 'cancelar') return;
            
            if (seleccion === 'monedero') {
                const monederos = FinanzasApp.data.monederos;
                if (monederos.length === 0) {
                    await FinanzasApp.showMessage('Error', 'No hay monederos disponibles', 'error');
                    return;
                }
                
                let monederoId;
                if (monederos.length === 1) {
                    monederoId = monederos[0].id;
                } else {
                    const opcionesMonederos = monederos.map(m => ({
                        value: m.id,
                        label: `${m.nombre} (${FinanzasApp.formatCurrency(m.saldo)})`
                    }));
                    monederoId = await FinanzasApp.showSelect('Seleccionar monedero', '¿A qué monedero?', opcionesMonederos);
                    if (!monederoId) return;
                }
                
                const monedero = FinanzasApp.data.monederos.find(m => m.id === monederoId);
                if (monedero) {
                    monedero.saldo += alcancia.saldo;
                    await FinanzasApp.showMessage('✅ Dinero transferido', 
                        `Se transfirieron ${FinanzasApp.formatCurrency(alcancia.saldo)} a ${monedero.nombre}`, 
                        'success');
                }
                
            } else if (seleccion === 'tarjeta') {
                const tarjetas = FinanzasApp.data.tarjetas;
                if (tarjetas.length === 0) {
                    await FinanzasApp.showMessage('Error', 'No hay tarjetas disponibles', 'error');
                    return;
                }
                
                let tarjetaId;
                if (tarjetas.length === 1) {
                    tarjetaId = tarjetas[0].id;
                } else {
                    const opcionesTarjetas = tarjetas.map(t => ({
                        value: t.id,
                        label: `${t.nombre} (${FinanzasApp.formatCurrency(t.saldo)})`
                    }));
                    tarjetaId = await FinanzasApp.showSelect('Seleccionar tarjeta', '¿A qué tarjeta?', opcionesTarjetas);
                    if (!tarjetaId) return;
                }
                
                const tarjeta = FinanzasApp.data.tarjetas.find(t => t.id === tarjetaId);
                if (tarjeta) {
                    tarjeta.saldo += alcancia.saldo;
                    await FinanzasApp.showMessage('✅ Dinero transferido', 
                        `Se transfirieron ${FinanzasApp.formatCurrency(alcancia.saldo)} a ${tarjeta.nombre}`, 
                        'success');
                }
                
            } else if (seleccion.startsWith('alcancia:')) {
                const alcanciaDestinoId = seleccion.split(':')[1];
                const alcanciaDestino = FinanzasApp.data.alcancias.find(a => a.id === alcanciaDestinoId);
                if (alcanciaDestino) {
                    alcanciaDestino.saldo += alcancia.saldo;
                    alcanciaDestino.acumulado = (alcanciaDestino.acumulado || 0) + alcancia.saldo;
                    await FinanzasApp.showMessage('✅ Dinero transferido', 
                        `Se transfirieron ${FinanzasApp.formatCurrency(alcancia.saldo)} a ${alcanciaDestino.nombre}`, 
                        'success');
                }
                
            } else if (seleccion === 'eliminar') {
                const confirmarEliminar = await FinanzasApp.showConfirm(
                    '⚠️ ¡ATENCIÓN! ⚠️', 
                    `¿Estás ABSOLUTAMENTE SEGURO de querer ELIMINAR ${FinanzasApp.formatCurrency(alcancia.saldo)}?\n\n¡Este dinero se perderá para siempre!`
                );
                
                if (!confirmarEliminar) {
                    return this.eliminarAlcancia(id);
                }
                
                const confirmarEliminar2 = await FinanzasApp.showConfirm(
                    'Última oportunidad', 
                    `¿Realmente quieres perder ${FinanzasApp.formatCurrency(alcancia.saldo)}?`
                );
                
                if (!confirmarEliminar2) {
                    return this.eliminarAlcancia(id);
                }
                
                await FinanzasApp.showMessage('💰 Dinero eliminado', 
                    `Se han eliminado ${FinanzasApp.formatCurrency(alcancia.saldo)} de "${alcancia.nombre}"`, 
                    'warning');
            }
        } else {
            const confirmar = await FinanzasApp.showConfirm('Eliminar alcancía', 
                `¿Estás seguro de eliminar la alcancía "${alcancia.nombre}"?`);
            if (!confirmar) return;
        }
        
        FinanzasApp.data.alcancias = FinanzasApp.data.alcancias.filter(a => a.id !== id);
        
        await FinanzasApp.showMessage('🗑️ Alcancía eliminada', `La alcancía "${alcancia.nombre}" se ha eliminado correctamente.`, 'success');
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
            alcancia.acumulado = (alcancia.acumulado || 0) + cantidad;
            
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
        
        const opcionesJustificacion = [
            { value: 'sin_objetivo', label: 'Sin objetivo (retiro libre)' }
        ];
        
        const objetivosCompletados = alcancia.objetivos.filter(o => o.meta <= alcancia.saldo && !o.retirado);
        objetivosCompletados.forEach(o => {
            opcionesJustificacion.push({
                value: o.id,
                label: `${o.nombre}`
            });
        });
        
        opcionesJustificacion.push({ value: 'otros', label: 'Otros (especificar motivo)' });
        
        const seleccion = await FinanzasApp.showSelect('Motivo del retiro', 'Selecciona una opción:', opcionesJustificacion);
        if (!seleccion) return;
        
        let cantidad = 0;
        let justificacion = '';
        
        if (seleccion === 'sin_objetivo') {
            const cantidadStr = await FinanzasApp.showPrompt('Retirar dinero', 'Cantidad a retirar:', 'number');
            if (!cantidadStr) return;
            cantidad = parseFloat(cantidadStr);
            justificacion = 'Retiro sin objetivo';
            
        } else if (seleccion === 'otros') {
            const motivo = await FinanzasApp.showPrompt('Otro motivo', 'Especifica el motivo del retiro:', 'text');
            if (!motivo) return;
            
            const cantidadStr = await FinanzasApp.showPrompt('Retirar dinero', 'Cantidad a retirar:', 'number');
            if (!cantidadStr) return;
            cantidad = parseFloat(cantidadStr);
            justificacion = motivo;
            
        } else {
            const objetivo = alcancia.objetivos.find(o => o.id === seleccion);
            if (!objetivo) return;
            
            cantidad = objetivo.meta;
            justificacion = `Retiro del objetivo: ${objetivo.nombre}`;
            
            objetivo.retirado = true;
        }
        
        if (cantidad <= 0) {
            await FinanzasApp.showMessage('Cantidad inválida', 'Por favor ingresa una cantidad válida.', 'error');
            return;
        }
        
        if (alcancia.saldo >= cantidad) {
            alcancia.saldo -= cantidad;
            
            await FinanzasApp.showMessage('Retiro realizado', 
                `Has retirado ${FinanzasApp.formatCurrency(cantidad)} de "${alcancia.nombre}".\nMotivo: ${justificacion}`, 
                'success');
            
            FinanzasApp.saveData();
            this.actualizarVista();
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
        
        alcancia.objetivos.push({
            id: Date.now().toString(),
            nombre: nombre.trim(),
            meta: meta,
            completado: false,
            retirado: false
        });
        
        await FinanzasApp.showMessage('Objetivo creado', 
            `El objetivo "${nombre}" se ha añadido a "${alcancia.nombre}".`, 
            'success');
        
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async editarObjetivo(alcanciaId, objetivoId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const objetivo = alcancia.objetivos.find(o => o.id === objetivoId);
        if (!objetivo) return;
        
        if (alcancia.saldo >= objetivo.meta || objetivo.retirado) {
            await FinanzasApp.showMessage('Objetivo no editable', 
                'No puedes editar un objetivo que ya está completado o retirado.', 
                'warning');
            return;
        }
        
        const nuevoNombre = await FinanzasApp.showPrompt('Editar objetivo', 'Nuevo nombre:', 'text', objetivo.nombre);
        if (nuevoNombre === null) return;
        
        if (nuevoNombre.trim() && nuevoNombre !== objetivo.nombre) {
            objetivo.nombre = nuevoNombre.trim();
        }
        
        const nuevaMeta = await FinanzasApp.showPrompt('Editar meta', 'Nueva cantidad:', 'number', objetivo.meta.toString());
        if (nuevaMeta === null) return;
        
        if (nuevaMeta) {
            const meta = parseFloat(nuevaMeta);
            if (meta > 0) {
                objetivo.meta = meta;
            }
        }
        
        await FinanzasApp.showMessage('Objetivo actualizado', 'El objetivo se ha modificado correctamente.', 'success');
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async eliminarObjetivo(alcanciaId, objetivoId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const objetivo = alcancia.objetivos.find(o => o.id === objetivoId);
        if (!objetivo) return;
        
        const confirmar = await FinanzasApp.showConfirm('Eliminar objetivo', 
            '¿Estás seguro de eliminar este objetivo?');
        if (!confirmar) return;
        
        alcancia.objetivos = alcancia.objetivos.filter(o => o.id !== objetivoId);
        
        await FinanzasApp.showMessage('Objetivo eliminado', 'El objetivo se ha eliminado correctamente.', 'success');
        FinanzasApp.saveData();
        this.actualizarVista();
    },

    async mostrarEstadisticas(alcanciaId) {
        const alcancia = FinanzasApp.data.alcancias.find(a => a.id === alcanciaId);
        if (!alcancia) return;
        
        const acumulado = alcancia.acumulado || alcancia.saldo;
        const retirado = acumulado - alcancia.saldo;
        const objetivosCompletados = alcancia.objetivos.filter(o => o.meta <= alcancia.saldo).length;
        const objetivosRetirados = alcancia.objetivos.filter(o => o.retirado).length;
        const objetivosActivos = alcancia.objetivos.length - objetivosCompletados - objetivosRetirados;
        
        const saldoUSD = FinanzasApp.formatUSD(alcancia.saldo);
        const acumuladoUSD = FinanzasApp.formatUSD(acumulado);
        const retiradoUSD = FinanzasApp.formatUSD(retirado);
        
        const modal = document.getElementById('customModal');
        const title = document.getElementById('modalTitle');
        const input = document.getElementById('modalInput');
        const cancelBtn = document.getElementById('modalCancel');
        const confirmBtn = document.getElementById('modalConfirm');
        
        input.style.display = 'none';
        cancelBtn.textContent = 'Cerrar';
        confirmBtn.style.display = 'none';
        
        title.innerHTML = `<i class="fas fa-chart-bar"></i> ${alcancia.nombre} - Estadísticas`;
        
        const statsDiv = document.createElement('div');
        statsDiv.className = 'stats-container';
        statsDiv.innerHTML = `
            <div class="stats-card">
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-coins" style="color:var(--success-color);"></i> Saldo actual</span>
                    <span class="stats-value positive">
                        ${FinanzasApp.formatCurrency(alcancia.saldo)} 
                        <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">
                            (${saldoUSD})
                        </span>
                    </span>
                </div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-arrow-up"></i> Total acumulado</span>
                    <span class="stats-value">
                        ${FinanzasApp.formatCurrency(acumulado)} 
                        <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">
                            (${acumuladoUSD})
                        </span>
                    </span>
                </div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-arrow-down" style="color:var(--error-color);"></i> Total retirado</span>
                    <span class="stats-value negative">
                        ${FinanzasApp.formatCurrency(retirado)} 
                        <span style="font-size:0.8rem; font-weight:400; color:var(--text-secondary);">
                            (${retiradoUSD})
                        </span>
                    </span>
                </div>
                <div class="stats-divider"></div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-bullseye"></i> Total objetivos</span>
                    <span class="stats-value">${alcancia.objetivos.length}</span>
                </div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-check-circle" style="color:var(--success-color);"></i> Completados</span>
                    <span class="stats-value success">${objetivosCompletados}</span>
                </div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-undo-alt"></i> Retirados</span>
                    <span class="stats-value">${objetivosRetirados}</span>
                </div>
                <div class="stats-row">
                    <span class="stats-label"><i class="fas fa-play"></i> Activos</span>
                    <span class="stats-value">${objetivosActivos}</span>
                </div>
            </div>
        `;
        
        modal.querySelector('.modal-content').insertBefore(statsDiv, modal.querySelector('.modal-buttons'));
        modal.style.display = 'flex';
        
        const cleanup = () => {
            modal.style.display = 'none';
            input.style.display = 'block';
            cancelBtn.textContent = 'Cancelar';
            confirmBtn.style.display = 'inline-block';
            statsDiv.remove();
            cancelBtn.removeEventListener('click', onCancel);
        };
        
        const onCancel = () => {
            cleanup();
        };
        
        cancelBtn.addEventListener('click', onCancel);
    },

    actualizarVista() {
        document.getElementById('listaAlcancia').innerHTML = this.renderAlcancia();
        FinanzasApp.updateTotalGeneral();
    }
};

window.Alcancia = Alcancia;
