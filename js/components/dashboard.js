const Dashboard = {
    currentPeriod: localStorage.getItem('dashboardPeriod') || 'mes',
    currentDate: new Date(),
    chart: null,
    
    render() {
        try {
            const year = this.currentDate.getFullYear();
            const month = this.currentDate.getMonth();
            const firstDay = new Date(year, month, 1).getDay();
            const daysInMonth = new Date(year, month + 1, 0).getDate();
            
            const startDay = firstDay === 0 ? 6 : firstDay - 1;
            
            return `
                <div class="dashboard">
                    <div class="period-selector">
                        <button class="period-btn ${this.currentPeriod === 'dia' ? 'active' : ''}" data-period="dia"><i class="fas fa-calendar-day"></i> Día</button>
                        <button class="period-btn ${this.currentPeriod === 'mes' ? 'active' : ''}" data-period="mes"><i class="fas fa-calendar-alt"></i> Mes</button>
                        <button class="period-btn ${this.currentPeriod === 'año' ? 'active' : ''}" data-period="año"><i class="fas fa-calendar"></i> Año</button>
                    </div>

                    <div class="resumen-cards">
                        <div class="resumen-item">
                            <div class="resumen-label"><i class="fas fa-arrow-down" style="color:var(--success-color);"></i> Ingresos</div>
                            <div class="resumen-value ingresos" id="totalIngresos">0.00 $</div>
                        </div>
                        <div class="resumen-item">
                            <div class="resumen-label"><i class="fas fa-arrow-up" style="color:var(--error-color);"></i> Gastos</div>
                            <div class="resumen-value gastos" id="totalGastos">0.00 $</div>
                        </div>
                        <div class="resumen-item">
                            <div class="resumen-label"><i class="fas fa-balance-scale"></i> Balance</div>
                            <div class="resumen-value balance" id="totalBalance">0.00 $</div>
                        </div>
                        <div class="resumen-item" style="background-color: var(--accent-color); border-color: var(--accent-color);">
                            <div class="resumen-label" style="color: white; opacity: 0.9;"><i class="fas fa-dollar-sign"></i> Total en USD</div>
                            <div class="resumen-value" id="totalUSD" style="color: white; font-size: 1.4rem;">
                                ${FinanzasApp.formatUSD(FinanzasApp.calcularTotalGeneral())}
                            </div>
                        </div>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-hand-holding-usd"></i> Resumen de deudas</h3>
                        <div id="resumenDeudas">${this.renderResumenDeudas()}</div>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-handshake"></i> Resumen de préstamos</h3>
                        <div id="resumenPrestamos">${this.renderResumenPrestamos()}</div>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-credit-card"></i> Distribución por método</h3>
                        <div id="resumenMetodos">${this.renderResumenMetodos()}</div>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-chart-line"></i> Evolución</h3>
                        <div class="chart-container">
                            <canvas id="dashboardChart"></canvas>
                        </div>
                    </div>

                    ${this.currentPeriod === 'mes' ? `
                        <div class="card calendar-card">
                            <div class="calendar-header">
                                <button class="calendar-nav" id="prevMonth"><i class="fas fa-chevron-left"></i></button>
                                <h3><i class="fas fa-calendar-alt"></i> ${this.getMonthName(month)} ${year}</h3>
                                <button class="calendar-nav" id="nextMonth"><i class="fas fa-chevron-right"></i></button>
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
                                    const balance = (ingresos || 0) - (gastos || 0);
                                    
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
                            <i class="fas fa-clock"></i> ${this.currentPeriod === 'dia' ? 'Hoy' : 'Selecciona un día'}
                        </h3>
                        <ul class="movimientos-list" id="listaMovimientosDia">
                            ${this.currentPeriod === 'dia' ? this.renderMovimientosDia(new Date().toISOString().split('T')[0]) : ''}
                        </ul>
                    </div>

                    <div class="card" id="ultimosMovimientosCard" style="${this.currentPeriod !== 'dia' ? 'display: block;' : 'display: none;'}">
                        <h3 class="section-title"><i class="fas fa-history"></i> Últimos movimientos</h3>
                        <ul class="movimientos-list" id="ultimosMovimientos">
                            ${this.renderUltimosMovimientos()}
                        </ul>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-piggy-bank"></i> Progreso de alcancías</h3>
                        <div id="progresoAlcancia">${this.renderProgresoAlcancia()}</div>
                    </div>

                    <div class="card">
                        <h3 class="section-title"><i class="fas fa-bell"></i> Alertas</h3>
                        <div class="alertas" id="alertas">${this.renderAlertas()}</div>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error en Dashboard.render():', error);
            return '<div class="card"><p class="empty-state">Error al cargar el dashboard</p></div>';
        }
    },

    renderResumenDeudas() {
        try {
            const deudas = FinanzasApp.data.deudas || [];
            if (deudas.length === 0) {
                return '<p class="empty-state">No hay deudas registradas</p>';
            }

            const totalDeudas = deudas.reduce((sum, d) => sum + (d.montoTotal || 0), 0);
            const totalPagado = deudas.reduce((sum, d) => sum + (d.montoPagado || 0), 0);
            const totalPendiente = totalDeudas - totalPagado;

            return `
                <div class="stats-card">
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-coins"></i> Total deudas</span>
                        <span class="stats-value">${FinanzasApp.formatCurrency(totalDeudas)}</span>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-check-circle" style="color:var(--success-color);"></i> Total pagado</span>
                        <span class="stats-value success">${FinanzasApp.formatCurrency(totalPagado)}</span>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-exclamation-triangle" style="color:var(--warning-color);"></i> Pendiente</span>
                        <span class="stats-value warning">${FinanzasApp.formatCurrency(totalPendiente)}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error en renderResumenDeudas:', error);
            return '<p class="empty-state">Error al cargar deudas</p>';
        }
    },

    renderResumenPrestamos() {
        try {
            const prestamos = FinanzasApp.data.prestamos || [];
            if (prestamos.length === 0) {
                return '<p class="empty-state">No hay préstamos</p>';
            }

            const activos = prestamos.filter(p => p.estado === 'activo');
            const totalPrestado = activos.reduce((sum, p) => sum + (p.montoTotal || 0), 0);
            const totalRecuperado = activos.reduce((sum, p) => sum + (p.montoRecuperado || 0), 0);
            const totalPendiente = totalPrestado - totalRecuperado;

            return `
                <div class="stats-card">
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-hand-holding-usd"></i> Préstamos activos</span>
                        <span class="stats-value">${activos.length}</span>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-coins"></i> Total prestado</span>
                        <span class="stats-value">${FinanzasApp.formatCurrency(totalPrestado)}</span>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-check-circle" style="color:var(--success-color);"></i> Recuperado</span>
                        <span class="stats-value success">${FinanzasApp.formatCurrency(totalRecuperado)}</span>
                    </div>
                    <div class="stats-row">
                        <span class="stats-label"><i class="fas fa-exclamation-triangle" style="color:var(--warning-color);"></i> Pendiente</span>
                        <span class="stats-value warning">${FinanzasApp.formatCurrency(totalPendiente)}</span>
                    </div>
                </div>
            `;
        } catch (error) {
            console.error('Error en renderResumenPrestamos:', error);
            return '<p class="empty-state">Error al cargar préstamos</p>';
        }
    },

    renderResumenMetodos() {
        try {
            const metodos = {};
            const configMetodos = FinanzasApp.data.config?.metodosPago || ['Efectivo', 'Tarjeta'];
            
            configMetodos.forEach(m => metodos[m] = 0);
            
            (FinanzasApp.data.ingresos || []).forEach(i => {
                const metodo = i.metodo || 'Efectivo';
                metodos[metodo] = (metodos[metodo] || 0) + (i.cantidad || 0);
            });
            
            return Object.entries(metodos).map(([metodo, total]) => `
                <div class="metodo-item">
                    <div class="metodo-header">
                        <span class="metodo-nombre"><i class="fas fa-credit-card"></i> ${metodo}</span>
                        <span class="metodo-total positive">${FinanzasApp.formatCurrency(total)}</span>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error en renderResumenMetodos:', error);
            return '<p class="empty-state">Error al cargar métodos</p>';
        }
    },

    init() {
        try {
            this.setupPeriodButtons();
            this.setupCalendarNav();
            this.updateResumen();
            this.initChart();
        } catch (error) {
            console.error('Error en Dashboard.init():', error);
        }
    },

    setupPeriodButtons() {
        try {
            document.querySelectorAll('.period-btn').forEach(btn => {
                btn.addEventListener('click', (e) => {
                    document.querySelectorAll('.period-btn').forEach(b => b.classList.remove('active'));
                    e.target.classList.add('active');
                    this.currentPeriod = e.target.dataset.period;
                    localStorage.setItem('dashboardPeriod', this.currentPeriod);
                    FinanzasApp.renderView('dashboard');
                });
            });
        } catch (error) {
            console.error('Error en setupPeriodButtons:', error);
        }
    },

    setupCalendarNav() {
        try {
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
        } catch (error) {
            console.error('Error en setupCalendarNav:', error);
        }
    },

    getMonthName(month) {
        const months = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'];
        return months[month] || '';
    },

    getDayTotal(dateStr, tipo) {
        try {
            if (tipo === 'ingreso') {
                if (!FinanzasApp.data.ingresos) return 0;
                return FinanzasApp.data.ingresos
                    .filter(i => i && i.fecha === dateStr)
                    .reduce((sum, i) => sum + (i.cantidad || 0), 0);
            } else {
                if (!FinanzasApp.data.gastos) return 0;
                return FinanzasApp.data.gastos
                    .filter(g => g && g.fecha === dateStr)
                    .reduce((sum, g) => sum + (g.cantidad || 0), 0);
            }
        } catch (error) {
            console.error('Error en getDayTotal:', error);
            return 0;
        }
    },

    async showDayDetails(dateStr) {
        try {
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
            document.getElementById('movimientosDiaTitulo').innerHTML = `<i class="fas fa-calendar-day"></i> ${titulo}`;
            
            document.getElementById('listaMovimientosDia').innerHTML = this.renderMovimientosDia(dateStr);
            this.updateResumen();
        } catch (error) {
            console.error('Error en showDayDetails:', error);
        }
    },

    renderMovimientosDia(dateStr) {
        try {
            const ingresos = (FinanzasApp.data.ingresos || [])
                .filter(i => i && i.fecha === dateStr)
                .map(i => ({ ...i, tipo: 'ingreso' }));
            
            const gastos = (FinanzasApp.data.gastos || [])
                .filter(g => g && g.fecha === dateStr)
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
                        <i class="fas ${m.tipo === 'ingreso' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="movimiento-info">
                        <div class="movimiento-concepto">${m.descripcion || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}</div>
                        <div class="movimiento-fecha"><i class="far fa-calendar-alt"></i> ${FinanzasApp.formatDate(m.fecha)} · <i class="fas fa-credit-card"></i> ${m.metodo || 'Efectivo'}</div>
                    </div>
                    <div class="movimiento-cantidad ${m.tipo}">
                        ${m.tipo === 'ingreso' ? '+' : '-'} ${FinanzasApp.formatCurrency(m.cantidad || 0)}
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error en renderMovimientosDia:', error);
            return '<li class="movimiento-item">Error al cargar movimientos</li>';
        }
    },

    initChart() {
        try {
            const ctx = document.getElementById('dashboardChart')?.getContext('2d');
            if (!ctx) return;
            
            if (this.chart) {
                this.chart.destroy();
            }
            
            const { labels, ingresosData, gastosData } = this.getChartData();
            
            const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
            
            this.chart = new Chart(ctx, {
                type: 'line',
                data: {
                    labels: labels,
                    datasets: [
                        {
                            label: 'Ingresos',
                            data: ingresosData,
                            borderColor: isDark ? '#4cd964' : '#25D366',
                            backgroundColor: isDark ? 'rgba(76, 217, 100, 0.1)' : 'rgba(37, 211, 102, 0.1)',
                            tension: 0.4,
                            fill: true
                        },
                        {
                            label: 'Gastos',
                            data: gastosData,
                            borderColor: isDark ? '#ff5e5e' : '#f15c5c',
                            backgroundColor: isDark ? 'rgba(255, 94, 94, 0.1)' : 'rgba(241, 92, 92, 0.1)',
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
                        },
                        tooltip: {
                            titleColor: isDark ? '#ffffff' : '#1a1a1a',
                            bodyColor: isDark ? '#b0b8c0' : '#667781',
                            backgroundColor: isDark ? '#1f2c34' : '#ffffff',
                            borderColor: isDark ? '#3a4a55' : '#f0f2f4',
                            borderWidth: 1
                        }
                    },
                    scales: {
                        y: {
                            beginAtZero: true,
                            grid: {
                                color: isDark ? '#3a4a55' : '#f0f2f4',
                            },
                            ticks: {
                                callback: function(value) {
                                    return value + '$';
                                },
                                color: isDark ? '#ffffff' : '#1a1a1a',
                                font: {
                                    weight: '500'
                                }
                            }
                        },
                        x: {
                            grid: {
                                display: false
                            },
                            ticks: {
                                color: isDark ? '#ffffff' : '#1a1a1a',
                                maxRotation: 45,
                                minRotation: 45,
                                font: {
                                    weight: '500'
                                }
                            }
                        }
                    }
                }
            });
        } catch (error) {
            console.error('Error en initChart:', error);
        }
    },

    getChartData() {
        try {
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
                        
                        const ingresos = (FinanzasApp.data.ingresos || [])
                            .filter(i => {
                                const fecha = new Date(i.fecha + 'T' + (i.hora || '12:00:00'));
                                return fecha >= horaInicio && fecha < horaFin;
                            })
                            .reduce((sum, i) => sum + (i.cantidad || 0), 0);
                        
                        const gastos = (FinanzasApp.data.gastos || [])
                            .filter(g => {
                                const fecha = new Date(g.fecha + 'T' + (g.hora || '12:00:00'));
                                return fecha >= horaInicio && fecha < horaFin;
                            })
                            .reduce((sum, g) => sum + (g.cantidad || 0), 0);
                        
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
                        
                        const ingresos = (FinanzasApp.data.ingresos || [])
                            .filter(i => i && i.fecha === dateStr)
                            .reduce((sum, i) => sum + (i.cantidad || 0), 0);
                        
                        const gastos = (FinanzasApp.data.gastos || [])
                            .filter(g => g && g.fecha === dateStr)
                            .reduce((sum, g) => sum + (g.cantidad || 0), 0);
                        
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
                        const monthStr = `${year}-${String(month).padStart(2,'0')}`;
                        
                        const ingresos = (FinanzasApp.data.ingresos || [])
                            .filter(i => i && i.fecha && i.fecha.startsWith(monthStr))
                            .reduce((sum, i) => sum + (i.cantidad || 0), 0);
                        
                        const gastos = (FinanzasApp.data.gastos || [])
                            .filter(g => g && g.fecha && g.fecha.startsWith(monthStr))
                            .reduce((sum, g) => sum + (g.cantidad || 0), 0);
                        
                        ingresosData.push(ingresos);
                        gastosData.push(gastos);
                    }
                    break;
            }
            
            return { labels, ingresosData, gastosData };
        } catch (error) {
            console.error('Error en getChartData:', error);
            return { labels: [], ingresosData: [], gastosData: [] };
        }
    },

    updateResumen() {
        try {
            const { ingresos, gastos } = this.calcularTotales();
            
            document.getElementById('totalIngresos').textContent = FinanzasApp.formatCurrency(ingresos || 0);
            document.getElementById('totalGastos').textContent = FinanzasApp.formatCurrency(gastos || 0);
            document.getElementById('totalBalance').textContent = FinanzasApp.formatCurrency((ingresos || 0) - (gastos || 0));
            
            const totalGeneral = FinanzasApp.calcularTotalGeneral();
            const totalUSD = document.getElementById('totalUSD');
            if (totalUSD) {
                totalUSD.textContent = FinanzasApp.formatUSD(totalGeneral);
            }
            
            const resumenDeudas = document.getElementById('resumenDeudas');
            if (resumenDeudas) {
                resumenDeudas.innerHTML = this.renderResumenDeudas();
            }

            const resumenPrestamos = document.getElementById('resumenPrestamos');
            if (resumenPrestamos) {
                resumenPrestamos.innerHTML = this.renderResumenPrestamos();
            }
            
            const resumenMetodos = document.getElementById('resumenMetodos');
            if (resumenMetodos) {
                resumenMetodos.innerHTML = this.renderResumenMetodos();
            }
            
            this.initChart();
        } catch (error) {
            console.error('Error en updateResumen:', error);
        }
    },

    calcularTotales() {
        try {
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
            
            const ingresos = (FinanzasApp.data.ingresos || [])
                .filter(i => i && i.fecha && i.fecha >= fechaInicioStr)
                .reduce((sum, i) => sum + (i.cantidad || 0), 0);
            
            const gastos = (FinanzasApp.data.gastos || [])
                .filter(g => g && g.fecha && g.fecha >= fechaInicioStr)
                .reduce((sum, g) => sum + (g.cantidad || 0), 0);
            
            return { ingresos, gastos };
        } catch (error) {
            console.error('Error en calcularTotales:', error);
            return { ingresos: 0, gastos: 0 };
        }
    },

    renderUltimosMovimientos() {
        try {
            const ingresos = (FinanzasApp.data.ingresos || []).map(i => ({ ...i, tipo: 'ingreso' }));
            const gastos = (FinanzasApp.data.gastos || []).map(g => ({ ...g, tipo: 'gasto' }));
            
            const todos = [...ingresos, ...gastos]
                .filter(m => m && m.fecha)
                .sort((a, b) => new Date(b.fecha) - new Date(a.fecha))
                .slice(0, 5);

            if (todos.length === 0) {
                return '<li class="movimiento-item">No hay movimientos recientes</li>';
            }

            return todos.map(m => `
                <li class="movimiento-item">
                    <div class="movimiento-icon ${m.tipo}">
                        <i class="fas ${m.tipo === 'ingreso' ? 'fa-arrow-down' : 'fa-arrow-up'}"></i>
                    </div>
                    <div class="movimiento-info">
                        <div class="movimiento-concepto">${m.descripcion || (m.tipo === 'ingreso' ? 'Ingreso' : 'Gasto')}</div>
                        <div class="movimiento-fecha"><i class="far fa-calendar-alt"></i> ${FinanzasApp.formatDate(m.fecha)} · <i class="fas fa-credit-card"></i> ${m.metodo || 'Efectivo'}</div>
                    </div>
                    <div class="movimiento-cantidad ${m.tipo}">
                        ${m.tipo === 'ingreso' ? '+' : '-'} ${FinanzasApp.formatCurrency(m.cantidad || 0)}
                    </div>
                </li>
            `).join('');
        } catch (error) {
            console.error('Error en renderUltimosMovimientos:', error);
            return '<li class="movimiento-item">Error al cargar movimientos</li>';
        }
    },

    renderProgresoAlcancia() {
        try {
            const alcancias = FinanzasApp.data.alcancias || [];
            
            if (alcancias.length === 0) {
                return '<p class="empty-state">No hay alcancías creadas</p>';
            }

            return alcancias.map(a => {
                const totalMetas = (a.objetivos || []).reduce((sum, o) => sum + (o.meta || 0), 0);
                const progreso = totalMetas > 0 ? ((a.saldo || 0) / totalMetas) * 100 : 0;
                
                return `
                    <div class="alcancia-progreso-item">
                        <div class="alcancia-header">
                            <span class="alcancia-nombre"><i class="fas fa-piggy-bank"></i> ${a.nombre || 'Alcancía'}</span>
                            <span class="alcancia-meta">${FinanzasApp.formatCurrency(a.saldo || 0)}</span>
                        </div>
                        <div class="progress-bar">
                            <div class="progress-fill" style="width: ${Math.min(progreso, 100)}%"></div>
                        </div>
                    </div>
                `;
            }).join('');
        } catch (error) {
            console.error('Error en renderProgresoAlcancia:', error);
            return '<p class="empty-state">Error al cargar alcancías</p>';
        }
    },

    renderAlertas() {
        try {
            const alertas = [];
            
            (FinanzasApp.data.alcancias || []).forEach(a => {
                (a.objetivos || []).forEach(o => {
                    if (o.meta <= (a.saldo || 0) && !o.retirado) {
                        alertas.push({
                            tipo: 'success',
                            mensaje: `¡Objetivo "${o.nombre}" alcanzado en ${a.nombre}!`
                        });
                    }
                });
            });

            const hoy = new Date();
            (FinanzasApp.data.deudas || []).forEach(d => {
                if (d.estado === 'activa' && d.fechaLimite) {
                    const fechaLimite = new Date(d.fechaLimite);
                    const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
                    
                    if (diasRestantes <= 7 && diasRestantes > 0) {
                        alertas.push({
                            tipo: 'warning',
                            mensaje: `⚠️ Deuda "${d.nombre}" vence en ${diasRestantes} días`
                        });
                    } else if (diasRestantes <= 0) {
                        alertas.push({
                            tipo: 'error',
                            mensaje: `❌ Deuda "${d.nombre}" está vencida`
                        });
                    }
                }
            });

            (FinanzasApp.data.prestamos || []).forEach(p => {
                if (p.estado === 'activo' && p.fechaLimite) {
                    const fechaLimite = new Date(p.fechaLimite);
                    const diasRestantes = Math.ceil((fechaLimite - hoy) / (1000 * 60 * 60 * 24));
                    
                    if (diasRestantes <= 7 && diasRestantes > 0) {
                        alertas.push({
                            tipo: 'info',
                            mensaje: `📌 Préstamo "${p.nombre}" vence en ${diasRestantes} días`
                        });
                    } else if (diasRestantes <= 0) {
                        alertas.push({
                            tipo: 'error',
                            mensaje: `❌ Préstamo "${p.nombre}" está vencido`
                        });
                    }
                }
            });

            if (alertas.length === 0) {
                return '<p class="empty-state">No hay alertas nuevas</p>';
            }

            return alertas.map(a => `
                <div class="alerta ${a.tipo}">
                    <i class="fas ${a.tipo === 'success' ? 'fa-check-circle' : a.tipo === 'warning' ? 'fa-exclamation-circle' : a.tipo === 'error' ? 'fa-times-circle' : 'fa-info-circle'}"></i>
                    ${a.mensaje}
                </div>
            `).join('');
        } catch (error) {
            console.error('Error en renderAlertas:', error);
            return '<p class="empty-state">Error al cargar alertas</p>';
        }
    }
};

window.Dashboard = Dashboard;
