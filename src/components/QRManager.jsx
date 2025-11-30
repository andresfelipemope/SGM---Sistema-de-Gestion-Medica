import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5Qrcode } from 'html5-qrcode'
import './QRManager.css'

function QRManager({ medicines, appointments, onImport, onFillMedicineForm, onFillAppointmentForm }) {
  const [qrData, setQrData] = useState(null)
  const [scannedData, setScannedData] = useState(null)
  const [selectedMedicines, setSelectedMedicines] = useState([])
  const [selectedAppointments, setSelectedAppointments] = useState([])
  const [showSelection, setShowSelection] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)
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
          // Asegurar que el canvas tenga un tamaño adecuado para el QR
          const size = 512 // Tamaño fijo para mejor calidad
          canvas.width = size
          canvas.height = size
          
          // Limpiar el canvas con fondo blanco
          ctx.fillStyle = '#FFFFFF'
          ctx.fillRect(0, 0, size, size)
          
          // Dibujar la imagen escalada
          ctx.drawImage(img, 0, 0, size, size)
          
          // Convertir a PNG con mejor calidad
          canvas.toBlob((blob) => {
            if (blob) {
              const url = URL.createObjectURL(blob)
              const link = document.createElement('a')
              link.href = url
              link.download = 'sgm-datos-qr.png'
              document.body.appendChild(link)
              link.click()
              document.body.removeChild(link)
              URL.revokeObjectURL(url)
            } else {
              alert('Error al generar el archivo PNG')
            }
          }, 'image/png', 1.0) // Calidad máxima
        }
        
        img.onerror = () => {
          alert('Error al procesar la imagen del QR')
        }
        
        // Codificar el SVG correctamente
        const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })
        const url = URL.createObjectURL(svgBlob)
        img.src = url
      } else {
        alert('No se encontró el código QR para descargar')
      }
    }
  }

  const handleFileUpload = async (event) => {
    const file = event.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      alert('Por favor, selecciona un archivo de imagen (PNG, JPG, etc.)')
      return
    }

    setUploadingFile(true)
    
    try {
      // Crear un elemento temporal para el escáner (oculto)
      let tempDiv = document.getElementById('temp-qr-reader')
      if (!tempDiv) {
        tempDiv = document.createElement('div')
        tempDiv.id = 'temp-qr-reader'
        tempDiv.style.display = 'none'
        tempDiv.style.position = 'absolute'
        tempDiv.style.left = '-9999px'
        document.body.appendChild(tempDiv)
      }
      
      // Crear instancia de Html5Qrcode con el ID del elemento temporal
      const html5QrCode = new Html5Qrcode('temp-qr-reader')
      
      try {
        console.log('Archivo seleccionado, tamaño:', file.size, 'tipo:', file.type, 'nombre:', file.name)
        
        // Escanear el QR del archivo directamente (scanFile acepta File o string URL)
        // Primero intentar con el archivo directamente
        let decodedText
        try {
          decodedText = await html5QrCode.scanFile(file, true)
          console.log('QR decodificado con archivo directo')
        } catch (fileError) {
          // Si falla, intentar con Data URL
          console.log('Intentando con Data URL...')
          const imageUrl = await new Promise((resolve, reject) => {
            const fileReader = new FileReader()
            fileReader.onload = (e) => {
              resolve(e.target.result)
            }
            fileReader.onerror = (error) => {
              reject(new Error('Error al leer el archivo: ' + error))
            }
            fileReader.readAsDataURL(file)
          })
          decodedText = await html5QrCode.scanFile(imageUrl, true)
          console.log('QR decodificado con Data URL')
        }
        
        console.log('QR decodificado, longitud:', decodedText.length)
        console.log('Primeros 200 caracteres:', decodedText.substring(0, 200))
        
        try {
          const parsedData = JSON.parse(decodedText)
          console.log('Datos parseados correctamente:', parsedData)
          // Procesar los datos escaneados (ahora con confirmación)
          await processScannedData(parsedData)
        } catch (parseError) {
          console.error('Error parsing QR JSON:', parseError)
          console.error('Texto completo:', decodedText)
          alert('El archivo contiene un QR pero no tiene el formato válido del sistema.\n\n' +
                'El QR fue leído pero no contiene datos JSON válidos.\n' +
                'Asegúrate de que el archivo fue generado por este sistema.')
        }
      } catch (scanError) {
        console.error('Error scanning file:', scanError)
        const errorMessage = scanError.message || scanError.toString() || 'Error desconocido'
        alert('No se pudo leer el código QR del archivo.\n\n' +
              'Asegúrate de que:\n' +
              '1. El archivo sea un PNG válido generado por este sistema\n' +
              '2. El código QR no esté dañado o borroso\n' +
              '3. El archivo no esté corrupto\n\n' +
              'Error técnico: ' + errorMessage)
      } finally {
        // Limpiar el elemento temporal
        try {
          if (tempDiv && tempDiv.parentNode) {
            tempDiv.parentNode.removeChild(tempDiv)
          }
        } catch (e) {
          console.warn('Error al limpiar elemento temporal:', e)
        }
        setUploadingFile(false)
        if (fileInputRef.current) {
          fileInputRef.current.value = ''
        }
      }
    } catch (error) {
      console.error('Error general:', error)
      const errorMessage = error.message || error.toString() || 'Error desconocido'
      alert('Error al procesar el archivo: ' + errorMessage)
      setUploadingFile(false)
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
  }

  const processScannedData = async (parsedData) => {
    // Detectar tipo de datos
    if (parsedData.type === 'medicine' && parsedData.data) {
      // Es una sola medicina - preguntar si quiere agendar
      const confirmMessage = `¿Deseas agendar esta medicina?\n\n` +
        `Nombre: ${parsedData.data.name}\n` +
        `Dosis: ${parsedData.data.dose}\n` +
        `Fecha inicio: ${parsedData.data.startDate ? new Date(parsedData.data.startDate).toLocaleDateString('es-ES') : 'N/A'}\n` +
        `Horarios: ${parsedData.data.times ? parsedData.data.times.join(', ') : 'N/A'}`
      
      if (window.confirm(confirmMessage)) {
        if (onFillMedicineForm) {
          onFillMedicineForm(parsedData.data)
          alert('Datos de medicina cargados. Ve a la pestaña de Medicinas para completar el registro.')
        }
      }
    } else if (parsedData.type === 'appointment' && parsedData.data) {
      // Es una sola cita - preguntar si quiere agendar
      const confirmMessage = `¿Deseas agendar esta cita médica?\n\n` +
        `Doctor: ${parsedData.data.doctor}\n` +
        `Fecha: ${parsedData.data.date ? new Date(parsedData.data.date).toLocaleDateString('es-ES') : 'N/A'}\n` +
        `Hora: ${parsedData.data.time || 'N/A'}\n` +
        `${parsedData.data.location ? `Lugar: ${parsedData.data.location}\n` : ''}`
      
      if (window.confirm(confirmMessage)) {
        if (onFillAppointmentForm) {
          onFillAppointmentForm(parsedData.data)
          alert('Datos de cita médica cargados. Ve a la pestaña de Citas Médicas para completar el registro.')
        }
      }
    } else if (parsedData.type === 'export' && (parsedData.medicines || parsedData.appointments)) {
      // Es una exportación múltiple - preguntar si quiere importar
      const medicinesCount = parsedData.medicines?.length || 0
      const appointmentsCount = parsedData.appointments?.length || 0
      const confirmMessage = `¿Deseas importar estos datos?\n\n` +
        `Medicinas: ${medicinesCount}\n` +
        `Citas médicas: ${appointmentsCount}\n\n` +
        `Esto reemplazará tus datos actuales.`
      
      if (window.confirm(confirmMessage)) {
        setScannedData(parsedData)
        // Auto-importar después de confirmar
        setTimeout(() => {
          handleImport()
        }, 100)
      }
    } else {
      alert('El código QR no contiene datos válidos del sistema.')
    }
  }


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
        <h2>Leer Código QR desde Archivo</h2>
        <p className="section-description">
          Sube un archivo de imagen (PNG, JPG, etc.) que contenga un código QR para importar información. 
          Si es una medicina o cita individual, se te preguntará si deseas agendarla.
        </p>

        {!scannedData && (
          <div className="scan-options">
            <div className="file-upload-section">
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/jpg,image/gif,image/webp"
                onChange={handleFileUpload}
                style={{ display: 'none' }}
                id="qr-file-input"
                disabled={uploadingFile}
              />
              <label htmlFor="qr-file-input" className={`file-upload-button ${uploadingFile ? 'disabled' : ''}`}>
                {uploadingFile ? 'Procesando archivo...' : '📁 Cargar Archivo QR (PNG, JPG, etc.)'}
              </label>
            </div>
          </div>
        )}

        {uploadingFile && (
          <div className="uploading-indicator">
            <p>Leyendo código QR del archivo...</p>
          </div>
        )}

        {scannedData && (
          <div className="scanned-data">
            <h3>Datos Leídos del QR</h3>
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
                if (fileInputRef.current) {
                  fileInputRef.current.value = ''
                }
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
          <li><strong>Para generar QR:</strong> Selecciona las medicinas y/o citas que deseas compartir, luego genera el código QR y descárgalo como imagen PNG.</li>
          <li><strong>Para leer QR:</strong> Haz clic en "Cargar Archivo QR" y selecciona la imagen PNG que descargaste. El sistema leerá el código QR automáticamente.</li>
          <li><strong>Formato QR:</strong> Los QR pueden contener una medicina individual, una cita individual, o múltiples items para importar.</li>
          <li><strong>Confirmación:</strong> Al leer un QR, se te preguntará si deseas agendar/importar los datos antes de hacerlo.</li>
        </ul>
      </div>
    </div>
  )
}

export default QRManager

