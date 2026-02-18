const FinanzasApp = {
    currentView: 'dashboard',
    theme: localStorage.getItem('theme') || 'light',
    data: {
        monederos: [],
        tarjetas: [],
        alcancias: [],
        ingresos: [],
        gastos: [],
        config: {
            tiposIngreso: ['Salario', 'Transferencias'],
            tiposGasto: ['Renta'],
            metodosPago: ['Efectivo', 'Tarjeta']
        }
    },

    init() {
        this.loadData();
        this.setupEventListeners();
        this.setTheme(this.theme);
        this.renderView(this.currentView);
        this.updateTotalGeneral();
    },

    setupEventListeners() {
        document.getElementById('menuToggle').addEventListener('click', () => {
            document.getElementById('sideMenu').classList.add('open');
            document.getElementById('menuOverlay').classList.add('open');
        });

        document.getElementById('closeMenu').addEventListener('click', () => {
            document.getElementById('sideMenu').classList.remove('open');
            document.getElementById('menuOverlay').classList.remove('open');
        });

        document.getElementById('menuOverlay').addEventListener('click', () => {
            document.getElementById('sideMenu').classList.remove('open');
            document.getElementById('menuOverlay').classList.remove('open');
        });

        document.querySelectorAll('.menu-item').forEach(item => {
            item.addEventListener('click', (e) => {
                e.preventDefault();
                const view = e.target.dataset.view;
                this.switchView(view);
                
                if (window.innerWidth < 768) {
                    document.getElementById('sideMenu').classList.remove('open');
                    document.getElementById('menuOverlay').classList.remove('open');
                }
            });
        });

        document.getElementById('themeToggle').addEventListener('click', () => {
            this.toggleTheme();
        });
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
            gastos: 'Gastos'
        };
        document.getElementById('headerTitle').textContent = titles[view] || 'Finanzas';

        this.renderView(view);
    },

    renderView(view) {
        const container = document.getElementById('mainContent');
        
        switch(view) {
            case 'dashboard':
                container.innerHTML = Dashboard.render();
                Dashboard.init();
                break;
            case 'alcancia':
                container.innerHTML = Alcancia.render();
                Alcancia.init();
                break;
            case 'monedero':
                container.innerHTML = Monedero.render();
                Monedero.init();
                break;
            case 'ingresos':
                container.innerHTML = Ingresos.render();
                Ingresos.init();
                break;
            case 'gastos':
                container.innerHTML = Gastos.render();
                Gastos.init();
                break;
        }
    },

    updateTotalGeneral() {
        const totalMonederos = this.data.monederos.reduce((sum, m) => sum + m.saldo, 0);
        const totalTarjetas = this.data.tarjetas.reduce((sum, t) => sum + t.saldo, 0);
        const totalAlcancia = this.data.alcancias.reduce((sum, a) => sum + a.saldo, 0);
        const total = totalMonederos + totalTarjetas + totalAlcancia;
        
        document.getElementById('totalGeneral').textContent = `${total.toFixed(2)} $`;
    },

    setTheme(theme) {
        this.theme = theme;
        document.documentElement.setAttribute('data-theme', theme);
        localStorage.setItem('theme', theme);
        
        const toggleBtn = document.getElementById('themeToggle');
        if (toggleBtn) {
            toggleBtn.textContent = theme === 'dark' ? 'Claro' : 'Oscuro';
        }
        
        // Actualizar gráfico si estamos en dashboard
        if (this.currentView === 'dashboard' && Dashboard.chart) {
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
            this.data = JSON.parse(saved);
            // Asegurar que tarjetas existe (para usuarios con datos antiguos)
            if (!this.data.tarjetas) {
                this.data.tarjetas = [];
            }
            // Asegurar que metodosPago existe
            if (!this.data.config.metodosPago) {
                this.data.config.metodosPago = ['Efectivo', 'Tarjeta'];
            }
        } else {
            this.data = {
                monederos: [
                    { id: 'm1', nombre: 'Mi monedero', saldo: 0, tipo: 'principal' }
                ],
                tarjetas: [
                    { id: 't1', nombre: 'Mi tarjeta', saldo: 0, tipo: 'principal' }
                ],
                alcancias: [],
                ingresos: [],
                gastos: [],
                config: {
                    tiposIngreso: ['Salario', 'Transferencias'],
                    tiposGasto: ['Renta'],
                    metodosPago: ['Efectivo', 'Tarjeta']
                }
            };
        }
    },

    saveData() {
        localStorage.setItem('finanzasData', JSON.stringify(this.data));
        this.updateTotalGeneral();
    },

    formatDate(dateStr) {
        const date = new Date(dateStr);
        return date.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
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
        
        // Limpiar el contenido previo
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
        
        select.innerHTML = opciones.map(o => {
            // Detectar si es un objetivo completado (para poner icono)
            const esObjetivo = o.value !== 'sin_objetivo' && o.value !== 'otros';
            const icono = esObjetivo ? '🎯' : '';
            return `<option value="${o.value}" style="background-color: var(--card-bg); color: var(--text-primary); padding: 0.5rem;">${icono}${o.label}</option>`;
        }).join('');
        
        input.style.display = 'none';
        modal.querySelector('.modal-content').insertBefore(select, modal.querySelector('.modal-buttons'));
        
        title.textContent = titulo;
        modal.style.display = 'flex';
        
        // Enfocar el select
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
            
            title.textContent = titulo;
            input.placeholder = placeholder;
            input.type = tipo;
            input.value = valorPorDefecto;
            
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
    }
};

window.FinanzasApp = FinanzasApp;
