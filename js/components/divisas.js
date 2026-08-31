const Divisas = {
    render() {
        const tasa = FinanzasApp.data.config.tasaUSD || 0;
        const { totalPropio, totalTerceros } = FinanzasApp.calcularTotalesPorPropiedad();
        const totalGeneral = totalPropio + totalTerceros;
        
        return `
            <div class="divisas-view">
                <div class="card">
                    <h3 class="section-title"><i class="fas fa-dollar-sign"></i> Configuración de divisas</h3>
                    <p class="text-secondary" style="margin-bottom: 1rem;">
                        <i class="fas fa-info-circle"></i> Ingresa el valor actual del <strong>USD</strong> en pesos cubanos (CUP).
                    </p>
                    <div class="form-group">
                        <label class="form-label"><i class="fas fa-exchange-alt"></i> Tasa de cambio (1 USD = ? CUP)</label>
                        <input type="number" step="0.01" class="form-input" id="tasaUSDInput" value="${tasa > 0 ? tasa : ''}" placeholder="Ej: 24.00">
                    </div>
                    <button class="btn btn-primary" id="guardarTasa"><i class="fas fa-save"></i> Guardar tasa</button>
                </div>

                <div class="card">
                    <h3 class="section-title"><i class="fas fa-chart-pie"></i> Vista previa</h3>
                    <div class="stats-card">
                        <div class="stats-row">
                            <span class="stats-label"><i class="fas fa-coins"></i> Total general (CUP)</span>
                            <span class="stats-value" id="previewTotalCUP">${FinanzasApp.formatCurrency(totalGeneral)}</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-label"><i class="fas fa-dollar-sign"></i> Total general (USD)</span>
                            <span class="stats-value" id="previewTotalUSD">${FinanzasApp.formatUSD(totalGeneral)}</span>
                        </div>
                        <div class="stats-divider"></div>
                        <div class="stats-row">
                            <span class="stats-label"><i class="fas fa-user" style="color:var(--success-color);"></i> Total propio (USD)</span>
                            <span class="stats-value" style="color:var(--success-color);">${FinanzasApp.formatUSD(totalPropio)}</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-label"><i class="fas fa-user-friends" style="color:var(--info-color);"></i> Total terceros (USD)</span>
                            <span class="stats-value" style="color:var(--info-color);">${FinanzasApp.formatUSD(totalTerceros)}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
    },

    init() {
        const guardarBtn = document.getElementById('guardarTasa');
        if (guardarBtn) {
            guardarBtn.addEventListener('click', () => {
                this.guardarTasa();
            });
        }
        const input = document.getElementById('tasaUSDInput');
        if (input) {
            input.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') this.guardarTasa();
            });
        }
    },

    guardarTasa() {
        const input = document.getElementById('tasaUSDInput');
        const valor = parseFloat(input.value);
        if (isNaN(valor) || valor <= 0) {
            FinanzasApp.showMessage('Error', 'Ingresa una tasa válida mayor a 0', 'error');
            return;
        }
        FinanzasApp.data.config.tasaUSD = valor;
        FinanzasApp.saveData();
        FinanzasApp.showMessage('Tasa guardada', `1 USD = ${valor.toFixed(2)} CUP`, 'success');
        FinanzasApp.renderView(FinanzasApp.currentView);
    },

    actualizarVista() {
        const container = document.getElementById('mainContent');
        if (container) {
            container.innerHTML = this.render();
            this.init();
        }
    }
};

window.Divisas = Divisas;
