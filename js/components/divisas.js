// js/components/divisas.js
const Divisas = {
    render() {
        const tasa = FinanzasApp.data.config.tasaUSD || 0;
        return `
            <div class="divisas-view">
                <div class="card">
                    <h3 class="section-title">Configuración de divisas</h3>
                    <p class="text-secondary" style="margin-bottom: 1rem;">
                        Ingresa el valor actual del <strong>USD</strong> en pesos cubanos (CUP).
                    </p>
                    <div class="form-group">
                        <label class="form-label">Tasa de cambio (1 USD = ? CUP)</label>
                        <input type="number" step="0.01" class="form-input" id="tasaUSDInput" value="${tasa > 0 ? tasa : ''}" placeholder="Ej: 24.00">
                    </div>
                    <button class="btn btn-primary" id="guardarTasa">Guardar tasa</button>
                </div>

                <div class="card">
                    <h3 class="section-title">Vista previa</h3>
                    <div class="stats-card">
                        <div class="stats-row">
                            <span class="stats-label">Total general (CUP)</span>
                            <span class="stats-value" id="previewTotalCUP">${FinanzasApp.formatCurrency(FinanzasApp.calcularTotalGeneral())}</span>
                        </div>
                        <div class="stats-row">
                            <span class="stats-label">Total general (USD)</span>
                            <span class="stats-value" id="previewTotalUSD">${FinanzasApp.formatUSD(FinanzasApp.calcularTotalGeneral())}</span>
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
        // Actualizar vista actual para reflejar cambios
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
