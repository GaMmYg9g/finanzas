const Dashboard = {
    currentPeriod: localStorage.getItem('dashboardPeriod') || 'mes',
    currentDate: new Date(),
    chart: null,
    
    render() {
        const year = this.currentDate.getFullYear();
        const month = this.currentDate.getMonth();
        const firstDay = new Date(year, month, 1).getDay();
        const daysInMonth = new Date(year, month + 1, 0).getDate();
        
        const startDay = firstDay === 0 ? 6 : firstDay - 1;
        
        return `
            <div class="dashboard">
                <div class="period-selector">
                    <button class="period-btn ${this.currentPeriod === 'dia' ? 'active' : ''}" data-period="dia">Día</button>
                    <button class="period-btn ${this.currentPeriod === 'mes' ? 'active' : ''}" data-period="mes">Mes</button>
                    <button class="period-btn ${this.currentPeriod === 'año' ? 'active' : ''}" data-period="año">Año</button>
                </div>

                <div class="resumen-cards">
                    <div class="resumen-item">
                        <div class="resumen-label">Ingresos</div>
                        <div class="resumen-value ingresos" id="totalIngresos">0.00 $</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-label">Gastos</div>
                        <div class="resumen-value gastos" id="totalGastos">0.00 $</div>
                    </div>
                    <div class="resumen-item">
                        <div class="resumen-label">Balance</div>
                        <div class="resumen-value balance" id="totalBalance">0.00 $</div>
                    </div>
                </div>

                <div class="card">
                    <h3 class="section-title">Distribución por método</h3>
                    <div id="resumenMetodos">
                        ${this.renderResumenMetodos()}
                    </div>
                </div>

                <div class="card">
                    <div class="chart-container">
                        <canvas id="dashboardChart"></canvas>
                    </div>
                </div>

                ${this.currentPeriod === 'mes' ? `
                    <div class="card calendar-card">
                        <div class="calendar-header">
                            <button class="calendar-nav" id="prevMonth">←</button>
                            <h3>${this.getMonthName(month)} ${year}</h3>
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
                                const ingresos = this.getDayTotal(dateStr, 'ingreso');
                                const gastos = this.getDayTotal(dateStr, 'gasto');
                                const balance = ingresos - gastos;
                                
                                return `
                                    <div class="calendar-day ${balance !== 0 ? 'has-movements' : ''}" 
                                         data-date="${dateStr}"
                                         onclick="Dashboard.showDayDetails('${dateStr}')">
                                        <span class="day-number">${day}</span>
                                        ${balance !== 0 ? `
                                            <div class="day-balance ${balance > 0 ? 'positive' : 'negative'}">
                                                ${balance > 0 ? '+' : ''}${Math.abs(balance).toFixed(0)}$
                                            </div>
                                        ` : ''}
                                    </div>
                                `;
                            }).join('')}
                        </div>
                        
                        <div class="calendar-legend">
                            <span><span class="legend-dot positive"></span> Más ingresos</span>
                            <span><span class="legend-dot negative"></span> Más gastos</span>
                        </div>
                    </div>
                ` : ''}

                <div class="card" id="movimientosDia" style="${this.currentPeriod === 'dia' ? 'display: block;' : 'display: none;'}">
                    <h3 class="section-title" id="movimientosDiaTitulo">
                        ${this.currentPeriod === 'dia' ? 'Hoy' : 'Selecciona un día'}
                    </h3>
                    <ul class="movimientos-list" id="listaMovimientosDia">
                        ${this.currentPeriod === 'dia' ? this.renderMovimientosDia(new Date().toISOString().split('T')[0]) : ''}
                    </ul>
                </div>

                <div class="card" id="ultimosMovimientosCard" style="${this.currentPeriod !== 'dia' ? 'display: block;' : 'display: none;'}">
                    <h3 class="section-title">Últimos movimientos</h3>
                    <ul class="movimientos-list" id="ultimosMovimientos">
                        ${this.renderUltimosMovimientos()}
                    </ul>
                </div>

                <div class="card">
                    <h3 class="section-title">Progreso de alcancías</h3>
                    <div id="progresoAlcancia">
                        ${this.renderProgresoAlcancia()}
                    </div>
                </div>

                <div class="card">
                    <h3 class="section-title">Alertas</h3>
                    <div class="alertas" id="alertas">
                        ${this.renderAlertas()}
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        this.setupPeriodButtons();
        this.setupCalendarNav();
        this.updateResumen();
        this.initChart();
    },

    renderResumenMetodos() {
        const metodos = {};
        
        // Inicializar métodos
        FinanzasApp.data.config.metodosPago.forEach(m => metodos[m] = 0);
        
        // Sumar ingresos por método
        FinanzasApp.data.ingresos.forEach(i => {
            const metodo = i.metodo || 'Efectivo';
            if (!metodos[metodo]) metodos[metodo] = 0;
            metodos[metodo] += i.cantidad;
        });
        
        // Restar gastos por método
        FinanzasApp.data.gastos.forEach(g => {
            const metodo = g.metodo || 'Efectivo';
            if (!metodos[metodo]) metodos[metodo] = 0;
            metodos[metodo] -= g.cantidad;
        });
        
        return Object.entries(metodos).map(([metodo, total]) => `
            <div class="metodo-item">
                <div class="metodo-header">
                    <span class="metodo-nombre">${metodo}</span>
                    <span class="metodo-total ${total >= 0 ? 'positive' : 'negative'}">${FinanzasApp.formatCurrency(total)}</span>
                </div>
            </div>
        `).join('');
    },

    setupPeriodButtons() {
        document.querySelectorAll('.period-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                e.target.classList.add('active');
                this.currentPeriod = e.target.dataset.period;
                localStorage.setItem('dashboardPeriod', this.currentPeriod);
                
                FinanzasApp.renderView('dashboard');
            });
        });
    },

    setupCalendarNav() {
        const prevBtn = document.getElementById('prevMonth');
        const nextBtn = document.getElementById('nextMonth');
        
        if (prevBtn) {
            prevBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() - 1);
                FinanzasApp.renderView('dashboard');
            });
        }
        
        if (nextBtn) {
            nextBtn.addEventListener('click', () => {
                this.currentDate.setMonth(this.currentDate.getMonth() + 1);
                FinanzasApp.renderView('dashboard');
            });
        }
    },

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month];
    },

    getDayTotal(dateStr, tipo) {
        if (tipo === 'ingreso') {
            return FinanzasApp.data.ingresos
                .filter(i => i.fecha === dateStr)
                .reduce((sum, i) => sum + i.cantidad, 0);
        } else {
            return FinanzasApp.data.gastos
                .filter(g => g.fecha === dateStr)
                .reduce((sum, g) => sum + g.cantidad, 0);
        }
    },

    async showDayDetails(dateStr) {
        this.currentPeriod = 'dia';
        localStorage.setItem('dashboardPeriod', 'dia');
        
        document.querySelectorAll('.period-btn').forEach(b => {
            b.classList.remove('active');
            if (b.dataset.period === 'dia') b.classList.add('active');
        });
        
        document.getElementById('movimientosDia').style.display = 'block';
        document.getElementById('ultimosMovimientosCard').style.display = 'none';
        
        const fecha = new Date(dateStr + 'T12:00:00');
        const titulo = fecha.toLocaleDateString('es-ES', { 
            weekday: 'long', 
            year: 'numeric', 
            month: 'long', 
            day: 'numeric' 
        });
        document.getElementById('movimientosDiaTitulo').textContent = titulo;
        
        document.getElementById('listaMovimientosDia').innerHTML = this.renderMovimientosDia(dateStr);
        this.updateResumen();
    },

    renderMovimientosDia(dateStr) {
        const ingresos = FinanzasApp.data.ingresos
            .filter(i => i.fecha === dateStr)
            .map(i => ({ ...i, tipo: 'ingreso' }));
        
        const gastos = FinanzasApp.data.gastos
            .filter(g => g.fecha === dateStr)
            .map(g => ({ ...g, tipo: 'gasto' }));
        
        const movimientos = [...ingresos, ...gastos].sort((a, b) => 
            new Date(b.fecha + 'T' + (b.hora || '12:00:00')) - new Date(a.fecha + 'T' + (a.hora || '12:00:00'))
        );
        
        if (movimientos.length === 0) {
            return '<li class="movimiento-item">No hay movimientos este día</li>';
        }
        
        return movimientos.map(m => `
            <li class="movimiento-item">
                <div class="movimiento-icon ${m.tipo}">
                    ${m.tipo === 'ingreso' ? 'I' : 'G'}
                </div>
                <div class="movimiento-info">
                    <div class="movimiento-concepto">${m.descripcion || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}</div>
                    <div class="movimiento-fecha">${FinanzasApp.formatDate(m.fecha)} · ${m.metodo || 'Efectivo'}</div>
                </div>
                <div class="movimiento-cantidad ${m.tipo}">
                    ${m.tipo === 'ingreso' ? '+' : '-'} ${FinanzasApp.formatCurrency(m.cantidad)}
                </div>
            </li>
        `).join('');
    },

    initChart() {
        const ctx = document.getElementById('dashboardChart')?.getContext('2d');
        if (!ctx) return;
        
        if (this.chart) {
            this.chart.destroy();
        }
        
        const { labels, ingresosData, gastosData } = this.getChartData();
        
        this.chart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Ingresos',
                        data: ingresosData,
                        borderColor: '#25D366',
                        backgroundColor: 'rgba(37, 211, 102, 0.1)',
                        tension: 0.4,
                        fill: true
                    },
                    {
                        label: 'Gastos',
                        data: gastosData,
                        borderColor: '#f15c5c',
                        backgroundColor: 'rgba(241, 92, 92, 0.1)',
                        tension: 0.4,
                        fill: true
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        display: false
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'var(--border-color)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + '$';
                            },
                            color: 'var(--text-secondary)'
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        },
                        ticks: {
                            color: 'var(--text-secondary)',
                            maxRotation: 45,
                            minRotation: 45
                        }
                    }
                }
            }
        });
    },

    getChartData() {
        const now = new Date();
        let labels = [];
        let ingresosData = [];
        let gastosData = [];
        
        switch(this.currentPeriod) {
            case 'dia':
                for (let i = 0; i < 12; i++) {
                    const hour = i * 2;
                    labels.push(`${hour}:00`);
                    
                    const horaInicio = new Date(now);
                    horaInicio.setHours(hour, 0, 0, 0);
                    const horaFin = new Date(now);
                    horaFin.setHours(hour + 2, 0, 0, 0);
                    
                    const ingresos = FinanzasApp.data.ingresos
                        .filter(i => {
                            const fecha = new Date(i.fecha + 'T' + (i.hora || '12:00:00'));
                            return fecha >= horaInicio && fecha < horaFin;
                        })
                        .reduce((sum, i) => sum + i.cantidad, 0);
                    
                    const gastos = FinanzasApp.data.gastos
                        .filter(g => {
                            const fecha = new Date(g.fecha + 'T' + (g.hora || '12:00:00'));
                            return fecha >= horaInicio && fecha < horaFin;
                        })
                        .reduce((sum, g) => sum + g.cantidad, 0);
                    
                    ingresosData.push(ingresos);
                    gastosData.push(gastos);
                }
                break;
                
            case 'mes':
                for (let i = 29; i >= 0; i--) {
                    const date = new Date(now);
                    date.setDate(date.getDate() - i);
                    const dateStr = date.toISOString().split('T')[0];
                    
                    labels.push(date.getDate().toString());
                    
                    const ingresos = FinanzasApp.data.ingresos
                        .filter(i => i.fecha === dateStr)
                        .reduce((sum, i) => sum + i.cantidad, 0);
                    
                    const gastos = FinanzasApp.data.gastos
                        .filter(g => g.fecha === dateStr)
                        .reduce((sum, g) => sum + g.cantidad, 0);
                    
                    ingresosData.push(ingresos);
                    gastosData.push(gastos);
                }
                break;
                
            case 'año':
                for (let i = 11; i >= 0; i--) {
                    const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
                    labels.push(this.getMonthName(date.getMonth()).substring(0, 3));
                    
                    const year = date.getFullYear();
                    const month = date.getMonth() + 1;
                    
                    const ingresos = FinanzasApp.data.ingresos
                        .filter(i => {
                            const [y, m] = i.fecha.split('-');
                            return parseInt(y) === year && parseInt(m) === month;
                        })
                        .reduce((sum, i) => sum + i.cantidad, 0);
                    
                    const gastos = FinanzasApp.data.gastos
                        .filter(g => {
                            const [y, m] = g.fecha.split('-');
                            return parseInt(y) === year && parseInt(m) === month;
                        })
                        .reduce((sum, g) => sum + g.cantidad, 0);
                    
                    ingresosData.push(ingresos);
                    gastosData.push(gastos);
                }
                break;
        }
        
        return { labels, ingresosData, gastosData };
    },

    updateResumen() {
        const { ingresos, gastos } = this.calcularTotales();
        
        document.getElementById('totalIngresos').textContent = FinanzasApp.formatCurrency(ingresos);
        document.getElementById('totalGastos').textContent = FinanzasApp.formatCurrency(gastos);
        document.getElementById('totalBalance').textContent = FinanzasApp.formatCurrency(ingresos - gastos);
        
        document.getElementById('resumenMetodos').innerHTML = this.renderResumenMetodos();
        this.initChart();
    },

    calcularTotales() {
        const now = new Date();
        let fechaInicio;
        
        switch(this.currentPeriod) {
            case 'dia':
                fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
                break;
            case 'mes':
                fechaInicio = new Date(now.getFullYear(), now.getMonth(), 1);
                break;
            case 'año':
                fechaInicio = new Date(now.getFullYear(), 0, 1);
                break;
            default:
                fechaInicio = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        }
        
        const fechaInicioStr = `${fechaInicio.getFullYear()}-${String(fechaInicio.getMonth()+1).padStart(2,'0')}-${String(fechaInicio.getDate()).padStart(2,'0')}`;
        
        const ingresos = FinanzasApp.data.ingresos
            .filter(i => i.fecha >= fechaInicioStr)
            .reduce((sum, i) => sum + i.cantidad, 0);
        
        const gastos = FinanzasApp.data.gastos
            .filter(g => g.fecha >= fechaInicioStr)
            .reduce((sum, g) => sum + g.cantidad, 0);
        
        return { ingresos, gastos };
    },

    renderUltimosMovimientos() {
        const todos = [
            ...FinanzasApp.data.ingresos.map(i => ({ ...i, tipo: 'ingreso' })),
            ...FinanzasApp.data.gastos.map(g => ({ ...g, tipo: 'gasto' }))
        ].sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
         .slice(0, 5);

        if (todos.length === 0) {
            return '<li class="movimiento-item">No hay movimientos recientes</li>';
        }

        return todos.map(m => `
            <li class="movimiento-item">
                <div class="movimiento-icon ${m.tipo}">
                    ${m.tipo === 'ingreso' ? 'I' : 'G'}
                </div>
                <div class="movimiento-info">
                    <div class="movimiento-concepto">${m.descripcion || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}</div>
                    <div class="movimiento-fecha">${FinanzasApp.formatDate(m.fecha)} · ${m.metodo || 'Efectivo'}</div>
                </div>
                <div class="movimiento-cantidad ${m.tipo}">
                    ${m.tipo === 'ingreso' ? '+' : '-'} ${FinanzasApp.formatCurrency(m.cantidad)}
                </div>
            </li>
        `).join('');
    },

    renderProgresoAlcancia() {
        const alcancias = FinanzasApp.data.alcancias;
        
        if (alcancias.length === 0) {
            return '<p class="empty-state">No hay alcancías creadas</p>';
        }

        return alcancias.map(a => {
            const totalMetas = a.objetivos.reduce((sum, o) => sum + o.meta, 0);
            const progreso = totalMetas > 0 ? (a.saldo / totalMetas) * 100 : 0;
            
            return `
                <div class="alcancia-progreso-item">
                    <div class="alcancia-header">
                        <span class="alcancia-nombre">${a.nombre}</span>
                        <span class="alcancia-meta">${FinanzasApp.formatCurrency(a.saldo)}</span>
                    </div>
                    <div class="progress-bar">
                        <div class="progress-fill" style="width: ${Math.min(progreso, 100)}%"></div>
                    </div>
                </div>
            `;
        }).join('');
    },

    renderAlertas() {
        const alertas = [];
        
        FinanzasApp.data.alcancias.forEach(a => {
            a.objetivos.forEach(o => {
                if (o.meta <= a.saldo && !o.completado) {
                    alertas.push({
                        tipo: 'success',
                        mensaje: `¡Objetivo "${o.nombre}" alcanzado en ${a.nombre}!`
                    });
                }
            });
        });

        const gastosRecientes = FinanzasApp.data.gastos
            .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
            .slice(0, 3);
            
        gastosRecientes.forEach(g => {
            if (g.cantidad > 100) {
                alertas.push({
                    tipo: 'warning',
                    mensaje: `Gasto elevado: ${g.descripcion || 'Gasto'} de ${FinanzasApp.formatCurrency(g.cantidad)}`
                });
            }
        });

        if (alertas.length === 0) {
            return '<p class="empty-state">No hay alertas nuevas</p>';
        }

        return alertas.map(a => `
            <div class="alerta ${a.tipo}">${a.mensaje}</div>
        `).join('');
    }
};

window.Dashboard = Dashboard;
