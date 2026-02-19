const FinanzasApp = {
    currentView: 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    data: {
        monederos: [],
        tarjetas: [],
        alcancias: [],
        deudas: [],
        ingresos: [],
        gastos: [],
        config: {
            tiposIngreso: ['Salario', 'Transferencias'],
            tiposGasto: ['Renta'],
            metodosPago: ['Efectivo', 'Tarjeta']
        }
    },

    init() {
        console.log('🚀 Iniciando FinanzasApp...');
        this.loadData();
        this.setupEventListeners();
        this.setTheme(this.theme);
        this.renderView(this.currentView);
        this.updateTotalGeneral();
    },

    setupEventListeners() {
        const menuToggle = document.getElementById('menuToggle');
        if (menuToggle) {
            menuToggle.addEventListener('click', () => {
                const sideMenu = document.getElementById('sideMenu');
                const menuOverlay = document.getElementById('menuOverlay');
                if (sideMenu) sideMenu.classList.add('open');
                if (menuOverlay) menuOverlay.classList.add('open');
            });
        }

        const closeMenu = document.getElementById('closeMenu');
        if (closeMenu) {
            closeMenu.addEventListener('click', () => {
                const sideMenu = document.getElementById('sideMenu');
                const menuOverlay = document.getElementById('menuOverlay');
                if (sideMenu) sideMenu.classList.remove('open');
                if (menuOverlay) menuOverlay.classList.remove('open');
            });
        }

        const menuOverlay = document.getElementById('menuOverlay');
        if (menuOverlay) {
            menuOverlay.addEventListener('click', () => {
                const sideMenu = document.getElementById('sideMenu');
                if (sideMenu) sideMenu.classList.remove('open');
                menuOverlay.classList.remove('open');
            });
        }

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
                
                if (window.innerWidth < 768) {
                    const sideMenu = document.getElementById('sideMenu');
                    const menuOverlay = document.getElementById('menuOverlay');
                    if (sideMenu) sideMenu.classList.remove('open');
                    if (menuOverlay) menuOverlay.classList.remove('open');
                }
            });
        });

        const themeToggle = document.getElementById('themeToggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                this.toggleTheme();
            });
        }

        // BOTÓN DE REINICIO - NUEVO
        const resetBtn = document.getElementById('resetData');
        if (resetBtn) {
            resetBtn.addEventListener('click', async () => {
                const confirmar = await this.showConfirm('Reiniciar datos', '¿Seguro? Se borrarán TODOS tus datos');
                if (confirmar) {
                    localStorage.removeItem('finanzasData');
                    this.data = this.getDefaultData();
                    this.saveData();
                    this.renderView(this.currentView);
                    this.showMessage('Datos reiniciados', 'La app está como nueva', 'success');
                }
            });
        }
    },

    switchView(view) {
        this.currentView = view;
        
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
            if (item.dataset.view === view) {
                item.classList.add('active');
            }
        });

        const titles = {
            dashboard: 'Resumen',
            alcancia: 'Alcancía',
            monedero: 'Monedero',
            ingresos: 'Ingresos',
            gastos: 'Gastos',
            deudas: 'Deudas'
        };
        
        const headerTitle = document.getElementById('headerTitle');
        if (headerTitle) {
            headerTitle.textContent = titles[view] || 'Finanzas';
        }

        this.renderView(view);
    },

    renderView(view) {
        const container = document.getElementById('mainContent');
        if (!container) return;
        
        switch(view) {
            case 'dashboard':
                if (typeof Dashboard !== 'undefined') {
                    container.innerHTML = Dashboard.render();
                    if (Dashboard.init) Dashboard.init();
                }
                break;
                
            case 'alcancia':
                if (typeof Alcancia !== 'undefined') {
                    container.innerHTML = Alcancia.render();
                    if (Alcancia.init) Alcancia.init();
                }
                break;
                
            case 'monedero':
                if (typeof Monedero !== 'undefined') {
                    container.innerHTML = Monedero.render();
                    if (Monedero.init) Monedero.init();
                }
                break;
                
            case 'ingresos':
                if (typeof Ingresos !== 'undefined') {
                    container.innerHTML = Ingresos.render();
                    if (Ingresos.init) Ingresos.init();
                }
                break;
                
            case 'gastos':
                if (typeof Gastos !== 'undefined') {
                    container.innerHTML = Gastos.render();
                    if (Gastos.init) Gastos.init();
                }
                break;
                
            case 'deudas':
                if (typeof Deudas !== 'undefined') {
                    container.innerHTML = Deudas.render();
                    if (Deudas.init) Deudas.init();
                }
                break;
        }
    },

    updateTotalGeneral() {
        const totalMonederos = this.data.monederos.reduce((sum, m) => sum + (m.saldo || 0), 0);
        const totalTarjetas = this.data.tarjetas.reduce((sum, t) => sum + (t.saldo || 0), 0);
        const totalAlcancia = this.data.alcancias.reduce((sum, a) => sum + (a.saldo || 0), 0);
        const total = totalMonederos + totalTarjetas + totalAlcancia;
        
        const totalGeneral = document.getElementById('totalGeneral');
        if (totalGeneral) {
            totalGeneral.textContent = `${total.toFixed(2)} $`;
        }
    },

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? 'Claro' : 'Oscuro';
        }
        
        if (this.currentView === 'dashboard' && Dashboard && Dashboard.chart) {
            Dashboard.initChart();
        }
    },

    toggleTheme() {
        const newTheme = this.theme === 'light' ? 'dark' : 'light';
        this.setTheme(newTheme);
    },

    loadData() {
        const saved = localStorage.getItem('finanzasData');
        if (saved) {
            try {
                this.data = JSON.parse(saved);
                if (!this.data.tarjetas) this.data.tarjetas = [];
                if (!this.data.deudas) this.data.deudas = [];
                if (!this.data.config) this.data.config = {};
                if (!this.data.config.metodosPago) this.data.config.metodosPago = ['Efectivo', 'Tarjeta'];
                if (!this.data.config.tiposIngreso) this.data.config.tiposIngreso = ['Salario', 'Transferencias'];
                if (!this.data.config.tiposGasto) this.data.config.tiposGasto = ['Renta'];
            } catch (e) {
                this.data = this.getDefaultData();
            }
        } else {
            this.data = this.getDefaultData();
        }
    },

    getDefaultData() {
        return {
            monederos: [
                { id: 'm1', nombre: 'Mi monedero', saldo: 0, tipo: 'principal' }
            ],
            tarjetas: [
                { id: 't1', nombre: 'Mi tarjeta', saldo: 0, tipo: 'principal' }
            ],
            alcancias: [],
            deudas: [],
            ingresos: [],
            gastos: [],
            config: {
                tiposIngreso: ['Salario', 'Transferencias'],
                tiposGasto: ['Renta'],
                metodosPago: ['Efectivo', 'Tarjeta']
            }
        };
    },

    saveData() {
        try {
            localStorage.setItem('finanzasData', JSON.stringify(this.data));
            this.updateTotalGeneral();
        } catch (e) {}
    },

    formatDate(dateStr) {
        if (!dateStr) return '';
        const [año, mes, dia] = dateStr.split('-');
        const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        return fecha.toLocaleDateString('es-ES', { 
            day: '2-digit', 
            month: '2-digit', 
            year: 'numeric' 
        });
    },

    formatDateLong(dateStr) {
        if (!dateStr) return '';
        const [año, mes, dia] = dateStr.split('-');
        const fecha = new Date(parseInt(año), parseInt(mes) - 1, parseInt(dia));
        return fecha.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
    },

    formatCurrency(amount) {
        return `${amount.toFixed(2)} $`;
    },

    async showMessage(titulo, mensaje, tipo = 'info') {
        return new Promise((resolve) => {
            const toast = document.createElement('div');
            toast.className = `toast-message toast-${tipo}`;
            
            const icono = tipo === 'success' ? '✓' : tipo === 'error' ? '✗' : tipo === 'warning' ? '!' : 'i';
            
            toast.innerHTML = `
                <div class="toast-icon" style="font-weight: 700; font-size: 1.2rem;">${icono}</div>
                <div class="toast-content">
                    <div class="toast-title">${titulo}</div>
                    <div class="toast-text">${mensaje}</div>
                </div>
            `;
            
            document.body.appendChild(toast);
            setTimeout(() => toast.classList.add('show'), 10);
            setTimeout(() => {
                toast.classList.remove('show');
                setTimeout(() => {
                    document.body.removeChild(toast);
                    resolve();
                }, 300);
            }, 3000);
        });
    },

    async showConfirm(titulo, mensaje) {
        return new Promise((resolve) => {
            const modal = document.getElementById('customModal');
            const title = document.getElementById('modalTitle');
            const input = document.getElementById('modalInput');
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');
            
            if (!modal) {
                resolve(confirm(mensaje));
                return;
            }
            
            title.textContent = titulo;
            input.style.display = 'none';
            cancelBtn.textContent = 'No';
            confirmBtn.textContent = 'Sí';
            modal.style.display = 'flex';
            
            const cleanup = () => {
                modal.style.display = 'none';
                input.style.display = 'block';
                cancelBtn.textContent = 'Cancelar';
                confirmBtn.textContent = 'Aceptar';
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
            };
            
            const onCancel = () => {
                cleanup();
                resolve(false);
            };
            
            const onConfirm = () => {
                cleanup();
                resolve(true);
            };
            
            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
        });
    },

    async showSelect(titulo, mensaje, opciones) {
        return new Promise((resolve) => {
            const modal = document.getElementById('customModal');
            const title = document.getElementById('modalTitle');
            const input = document.getElementById('modalInput');
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');
            
            if (!modal) {
                const seleccion = prompt(mensaje + '\n' + opciones.map(o => o.label).join('\n'));
                resolve(seleccion);
                return;
            }
            
            const existingSelect = document.getElementById('modalSelect');
            if (existingSelect) existingSelect.remove();
            
            const select = document.createElement('select');
            select.className = 'form-input';
            select.id = 'modalSelect';
            select.style.marginBottom = '1.5rem';
            select.style.width = '100%';
            select.style.padding = '0.8rem';
            select.style.backgroundColor = 'var(--bg-primary)';
            select.style.border = '1px solid var(--border-color)';
            select.style.borderRadius = '8px';
            select.style.color = 'var(--text-primary)';
            select.style.fontSize = '1rem';
            
            select.innerHTML = opciones.map(o => `<option value="${o.value}">${o.label}</option>`).join('');
            
            input.style.display = 'none';
            modal.querySelector('.modal-content').insertBefore(select, modal.querySelector('.modal-buttons'));
            
            title.textContent = titulo;
            modal.style.display = 'flex';
            
            setTimeout(() => select.focus(), 100);
            
            const cleanup = () => {
                modal.style.display = 'none';
                input.style.display = 'block';
                select.remove();
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
                select.removeEventListener('keypress', onKeyPress);
            };
            
            const onCancel = () => {
                cleanup();
                resolve(null);
            };
            
            const onConfirm = () => {
                const valor = select.value;
                cleanup();
                resolve(valor);
            };
            
            const onKeyPress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                }
            };
            
            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
            select.addEventListener('keypress', onKeyPress);
        });
    },

    async showPrompt(titulo, placeholder = '', tipo = 'text', valorPorDefecto = '') {
        return new Promise((resolve) => {
            const modal = document.getElementById('customModal');
            const title = document.getElementById('modalTitle');
            const input = document.getElementById('modalInput');
            const cancelBtn = document.getElementById('modalCancel');
            const confirmBtn = document.getElementById('modalConfirm');
            
            if (!modal) {
                const valor = prompt(titulo + '\n' + placeholder, valorPorDefecto);
                resolve(valor);
                return;
            }
            
            title.textContent = titulo;
            input.placeholder = placeholder;
            input.type = tipo;
            input.value = valorPorDefecto;
            input.style.display = 'block';
            
            if (tipo === 'number') {
                input.setAttribute('inputmode', 'decimal');
                input.setAttribute('pattern', '[0-9]*');
            } else {
                input.setAttribute('inputmode', 'text');
                input.removeAttribute('pattern');
            }
            
            modal.style.display = 'flex';
            setTimeout(() => input.focus(), 100);
            
            const cleanup = () => {
                modal.style.display = 'none';
                cancelBtn.removeEventListener('click', onCancel);
                confirmBtn.removeEventListener('click', onConfirm);
                input.removeEventListener('keypress', onKeyPress);
            };
            
            const onCancel = () => {
                cleanup();
                resolve(null);
            };
            
            const onConfirm = () => {
                let valor = input.value;
                if (tipo === 'number' && valor) {
                    valor = valor.replace(',', '.');
                }
                cleanup();
                resolve(valor);
            };
            
            const onKeyPress = (e) => {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    onConfirm();
                }
            };
            
            cancelBtn.addEventListener('click', onCancel);
            confirmBtn.addEventListener('click', onConfirm);
            input.addEventListener('keypress', onKeyPress);
        });
    },

    async mostrarSelectorFecha(titulo = 'Seleccionar fecha') {
        return new Promise((resolve) => {
            const fechaActual = new Date();
            let mesActual = fechaActual.getMonth();
            let añoActual = fechaActual.getFullYear();
            let diaSeleccionado = null;
            
            const popup = document.createElement('div');
            popup.className = 'calendario-popup';
            popup.id = 'calendarioPopup';
            
            const actualizarCalendario = () => {
                const primerDia = new Date(añoActual, mesActual, 1).getDay();
                const diasEnMes = new Date(añoActual, mesActual + 1, 0).getDate();
                const diasMesAnterior = new Date(añoActual, mesActual, 0).getDate();
                
                let inicio = primerDia === 0 ? 6 : primerDia - 1;
                
                let html = `
                    <div class="calendario-popup-header">
                        <span class="calendario-popup-mes">${this.getMonthName(mesActual)} ${añoActual}</span>
                        <button class="calendario-popup-close" id="cerrarCalendario">&times;</button>
                    </div>
                    <div class="calendario-popup-weekdays">
                        <span>L</span><span>M</span><span>X</span><span>J</span><span>V</span><span>S</span><span>D</span>
                    </div>
                    <div class="calendario-popup-grid" id="calendarioGrid">
                `;
                
                for (let i = 0; i < inicio; i++) {
                    const dia = diasMesAnterior - inicio + i + 1;
                    html += `<div class="calendario-popup-dia otro-mes" data-dia="${dia}" data-mes="${mesActual-1}" data-año="${añoActual}">${dia}</div>`;
                }
                
                for (let i = 1; i <= diasEnMes; i++) {
                    const seleccionado = diaSeleccionado && 
                        diaSeleccionado.dia === i && 
                        diaSeleccionado.mes === mesActual && 
                        diaSeleccionado.año === añoActual;
                    html += `<div class="calendario-popup-dia ${seleccionado ? 'seleccionado' : ''}" data-dia="${i}" data-mes="${mesActual}" data-año="${añoActual}">${i}</div>`;
                }
                
                const totalCeldas = 42;
                const celdasRestantes = totalCeldas - (inicio + diasEnMes);
                for (let i = 1; i <= celdasRestantes; i++) {
                    html += `<div class="calendario-popup-dia otro-mes" data-dia="${i}" data-mes="${mesActual+1}" data-año="${añoActual}">${i}</div>`;
                }
                
                html += `
                    </div>
                    <div class="calendario-popup-footer">
                        <button class="calendario-popup-btn cancelar" id="cancelarFecha">Cancelar</button>
                        <button class="calendario-popup-btn aceptar" id="aceptarFecha">Aceptar</button>
                    </div>
                `;
                
                popup.innerHTML = html;
            };
            
            actualizarCalendario();
            document.body.appendChild(popup);
            setTimeout(() => popup.classList.add('mostrar'), 10);
            
            popup.addEventListener('click', (e) => {
                if (e.target.classList.contains('calendario-popup-dia')) {
                    const dia = e.target.dataset.dia;
                    const mes = parseInt(e.target.dataset.mes);
                    const año = parseInt(e.target.dataset.año);
                    
                    diaSeleccionado = { dia, mes, año };
                    
                    document.querySelectorAll('.calendario-popup-dia').forEach(el => {
                        el.classList.remove('seleccionado');
                    });
                    e.target.classList.add('seleccionado');
                }
            });
            
            document.getElementById('cerrarCalendario')?.addEventListener('click', () => {
                popup.classList.remove('mostrar');
                setTimeout(() => {
                    document.body.removeChild(popup);
                    resolve(null);
                }, 300);
            });
            
            document.getElementById('cancelarFecha')?.addEventListener('click', () => {
                popup.classList.remove('mostrar');
                setTimeout(() => {
                    document.body.removeChild(popup);
                    resolve(null);
                }, 300);
            });
            
            document.getElementById('aceptarFecha')?.addEventListener('click', () => {
                if (diaSeleccionado) {
                    const mes = String(diaSeleccionado.mes + 1).padStart(2, '0');
                    const dia = String(diaSeleccionado.dia).padStart(2, '0');
                    const fechaStr = `${diaSeleccionado.año}-${mes}-${dia}`;
                    
                    popup.classList.remove('mostrar');
                    setTimeout(() => {
                        document.body.removeChild(popup);
                        resolve(fechaStr);
                    }, 300);
                }
            });
        });
    },

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    }
};

window.FinanzasApp = FinanzasApp;
