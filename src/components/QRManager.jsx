import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner, Html5Qrcode } from 'html5-qrcode'
import './QRManager.css'

function QRManager({ medicines, appointments, onImport, onFillMedicineForm, onFillAppointmentForm }) {
  const [qrData, setQrData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [selectedAppointments, setSelectedAppointments] = useState([])
  const [showSelection, setShowSelection] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
  const scannerRef = useRef(null)
  const qrCodeRef = useRef(null)
  const fileInputRef = useRef(null)

  const handleMedicineToggle = (medId) => {
    setSelectedMedicines(prev => 
      prev.includes(medId) 
        ? prev.filter(id => id !== medId)
        : [...prev, medId]
    )
  }

  const handleAppointmentToggle = (aptId) => {
    setSelectedAppointments(prev => 
      prev.includes(aptId) 
        ? prev.filter(id => id !== aptId)
        : [...prev, aptId]
    )
  }

  const handleSelectAll = (type) => {
    if (type === 'medicines') {
      setSelectedMedicines(medicines.map(m => m.id))
    } else {
      setSelectedAppointments(appointments.map(a => a.id))
    }
  }

  const handleDeselectAll = (type) => {
    if (type === 'medicines') {
      setSelectedMedicines([])
    } else {
      setSelectedAppointments([])
    }
  }

  const generateQRCode = () => {
    if (selectedMedicines.length === 0 && selectedAppointments.length === 0) {
      alert('Por favor, selecciona al menos una medicina o cita médica para generar el QR')
      return
    }

    const selectedMedData = medicines.filter(m => selectedMedicines.includes(m.id))
    const selectedAptData = appointments.filter(a => selectedAppointments.includes(a.id))

    const dataToExport = {
      type: 'export',
      medicines: selectedMedData,
      appointments: selectedAptData,
      exportDate: new Date().toISOString()
    }
    setQrData(JSON.stringify(dataToExport))
    setShowSelection(false)
  }

  const startScanning = () => {
    setScanning(true)
    setScannedData(null)

    const scanner = new Html5QrcodeScanner(
      "qr-reader",
      {
        qrbox: {
          width: 250,
          height: 250
        },
        fps: 5,
        aspectRatio: 1.0
      },
      false
    )

    scannerRef.current = scanner

    scanner.render(
      (decodedText) => {
        try {
          const parsedData = JSON.parse(decodedText)
          setScanning(false)
          scanner.clear()
          scannerRef.current = null
          processScannedData(parsedData)
        } catch (error) {
          alert('Error al leer el código QR. Asegúrate de que sea un código válido del sistema.')
          console.error('Error parsing QR:', error)
        }
      },
      (errorMessage) => {
        // Silently ignore scanning errors (they're normal during scanning)
      }
    )
  }

  const stopScanning = () => {
    if (scannerRef.current) {
      scannerRef.current.clear()
      scannerRef.current = null
    }
    setScanning(false)
  }

  const handleImport = () => {
    if (scannedData) {
      if (window.confirm('¿Deseas importar estos datos? Esto reemplazará tus datos actuales.')) {
        onImport(scannedData)
        setScannedData(null)
        alert('Datos importados exitosamente')
      }
    }
  }

  const downloadQR = () => {
    if (qrCodeRef.current) {
      const svg = qrCodeRef.current.querySelector('svg')
      if (svg) {
        const svgData = new XMLSerializer().serializeToString(svg)
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        const img = new Image()
        
        img.onload = () => {
          canvas.width = img.width
          canvas.height = img.height
          ctx.drawImage(img, 0, 0)
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob)
            const link = document.createElement('a')
            link.href = url
            link.download = 'sgm-datos-qr.png'
            link.click()
            URL.revokeObjectURL(url)
          })
        }
        
        img.src = 'data:image/svg+xml;base64,' + btoa(svgData)
      }
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen')
      return
    }

    setUploadingFile(true)
    
    try {
      const html5QrCode = new Html5Qrcode()
      const fileReader = new FileReader()
      
      fileReader.onload = async (e) => {
        try {
          const imageUrl = e.target.result
          const decodedText = await html5QrCode.scanFile(imageUrl, true)
          
          try {
            const parsedData = JSON.parse(decodedText)
            processScannedData(parsedData)
          } catch (error) {
            alert('El archivo no contiene un código QR válido del sistema.')
            console.error('Error parsing QR:', error)
          }
        } catch (error) {
          alert('No se pudo leer el código QR del archivo. Asegúrate de que sea un QR válido.')
          console.error('Error scanning file:', error)
        } finally {
          setUploadingFile(false)
          if (fileInputRef.current) {
            fileInputRef.current.value = ''
          }
        }
      }
      
      fileReader.readAsDataURL(file)
    } catch (error) {
      alert('Error al procesar el archivo')
      console.error('Error:', error)
      setUploadingFile(false)
    }
  }

  const processScannedData = (parsedData) => {
    // Detectar tipo de datos
    if (parsedData.type === 'medicine' && parsedData.data) {
      // Es una sola medicina - llenar formulario
      if (onFillMedicineForm) {
        onFillMedicineForm(parsedData.data)
        alert('Datos de medicina cargados. Ve a la pestaña de Medicinas para completar el registro.')
      }
    } else if (parsedData.type === 'appointment' && parsedData.data) {
      // Es una sola cita - llenar formulario
      if (onFillAppointmentForm) {
        onFillAppointmentForm(parsedData.data)
        alert('Datos de cita médica cargados. Ve a la pestaña de Citas Médicas para completar el registro.')
      }
    } else if (parsedData.type === 'export' && (parsedData.medicines || parsedData.appointments)) {
      // Es una exportación múltiple
      setScannedData(parsedData)
    } else {
      alert('El código QR no contiene datos válidos del sistema.')
    }
  }

  useEffect(() => {
    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear()
      }
    }
  }, [])

  return (
    <div className="qr-manager-container">
      <div className="qr-section">
        <h2>Generar Código QR</h2>
        <p className="section-description">
          Selecciona las medicinas y/o citas médicas que deseas incluir en el código QR.
        </p>
        
        <div className="qr-actions">
          <button onClick={() => setShowSelection(!showSelection)} className="action-button">
            {showSelection ? 'Ocultar Selección' : 'Seleccionar Items para QR'}
          </button>
        </div>

        {showSelection && (
          <div className="selection-panel">
            <div className="selection-group">
              <div className="selection-header">
                <h3>💊 Medicinas ({selectedMedicines.length} seleccionadas)</h3>
                <div className="selection-controls">
                  <button onClick={() => handleSelectAll('medicines')} className="select-all-button">
                    Seleccionar Todas
                  </button>
                  <button onClick={() => handleDeselectAll('medicines')} className="deselect-all-button">
                    Deseleccionar
                  </button>
                </div>
              </div>
              {medicines.length === 0 ? (
                <p className="empty-selection">No hay medicinas registradas</p>
              ) : (
                <div className="selection-list">
                  {medicines.map(med => (
                    <label key={med.id} className="selection-item">
                      <input
                        type="checkbox"
                        checked={selectedMedicines.includes(med.id)}
                        onChange={() => handleMedicineToggle(med.id)}
                      />
                      <span>{med.name} - {med.dose}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <div className="selection-group">
              <div className="selection-header">
                <h3>🏥 Citas Médicas ({selectedAppointments.length} seleccionadas)</h3>
                <div className="selection-controls">
                  <button onClick={() => handleSelectAll('appointments')} className="select-all-button">
                    Seleccionar Todas
                  </button>
                  <button onClick={() => handleDeselectAll('appointments')} className="deselect-all-button">
                    Deseleccionar
                  </button>
                </div>
              </div>
              {appointments.length === 0 ? (
                <p className="empty-selection">No hay citas registradas</p>
              ) : (
                <div className="selection-list">
                  {appointments.map(apt => (
                    <label key={apt.id} className="selection-item">
                      <input
                        type="checkbox"
                        checked={selectedAppointments.includes(apt.id)}
                        onChange={() => handleAppointmentToggle(apt.id)}
                      />
                      <span>{apt.doctor} - {new Date(apt.date).toLocaleDateString('es-ES')} {apt.time}</span>
                    </label>
                  ))}
                </div>
              )}
            </div>

            <button onClick={generateQRCode} className="generate-qr-button">
              Generar Código QR con Selección
            </button>
          </div>
        )}

        {qrData && (
          <div className="qr-display">
            <div ref={qrCodeRef} className="qr-code-container">
              <QRCodeSVG 
                value={qrData} 
                size={300}
                level="H"
                includeMargin={true}
              />
            </div>
            <div className="qr-info">
              <p><strong>Medicinas incluidas:</strong> {selectedMedicines.length}</p>
              <p><strong>Citas incluidas:</strong> {selectedAppointments.length}</p>
              <button onClick={downloadQR} className="download-button">
                Descargar QR
              </button>
              <button onClick={() => {
                setQrData(null)
                setSelectedMedicines([])
                setSelectedAppointments([])
              }} className="clear-button">
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="qr-section">
        <h2>Escanear Código QR</h2>
        <p className="section-description">
          Escanea un código QR para importar información. Si es una medicina o cita individual, se llenará automáticamente el formulario correspondiente.
        </p>

        {!scanning && !scannedData && (
          <div className="scan-options">
            <button onClick={startScanning} className="action-button">
              Iniciar Escaneo con Cámara
            </button>
            <div className="file-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="qr-file-input"
              />
              <label htmlFor="qr-file-input" className="file-upload-button">
                {uploadingFile ? 'Procesando...' : 'Cargar Archivo QR'}
              </label>
            </div>
          </div>
        )}

        {scanning && (
          <div className="scanner-container">
            <div id="qr-reader"></div>
            <button onClick={stopScanning} className="stop-button">
              Detener Escaneo
            </button>
          </div>
        )}

        {scannedData && (
          <div className="scanned-data">
            <h3>Datos Escaneados</h3>
            <div className="data-preview">
              <p><strong>Medicinas encontradas:</strong> {scannedData.medicines?.length || 0}</p>
              <p><strong>Citas encontradas:</strong> {scannedData.appointments?.length || 0}</p>
              {scannedData.exportDate && (
                <p><strong>Fecha de exportación:</strong> {new Date(scannedData.exportDate).toLocaleString('es-ES')}</p>
              )}
            </div>
            <div className="import-actions">
              <button onClick={handleImport} className="import-button">
                Importar Datos
              </button>
              <button onClick={() => {
                setScannedData(null)
                stopScanning()
              }} className="cancel-button">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="qr-instructions">
        <h3>Instrucciones</h3>
        <ul>
          <li><strong>Para generar QR:</strong> Selecciona las medicinas y/o citas que deseas compartir, luego genera el código QR.</li>
          <li><strong>Para escanear QR:</strong> Haz clic en "Iniciar Escaneo" y apunta la cámara hacia el código QR. Asegúrate de dar permisos de cámara al navegador.</li>
          <li><strong>Formato QR:</strong> Los QR pueden contener una medicina individual, una cita individual, o múltiples items para importar.</li>
          <li><strong>Llenado automático:</strong> Si escaneas un QR de un solo item, el formulario correspondiente se llenará automáticamente.</li>
        </ul>
      </div>
    </div>
  )
}

export default QRManager

