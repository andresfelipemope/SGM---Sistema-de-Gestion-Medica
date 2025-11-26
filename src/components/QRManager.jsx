import { useState, useRef, useEffect } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { Html5QrcodeScanner } from 'html5-qrcode'
import './QRManager.css'

function QRManager({ medicines, appointments, onImport }) {
  const [qrData, setQrData] = useState(null)
  const [scanning, setScanning] = useState(false)
  const [scannedData, setScannedData] = useState(null)
  const scannerRef = useRef(null)
  const qrCodeRef = useRef(null)

  const generateQRCode = () => {
    const dataToExport = {
      medicines,
      appointments,
      exportDate: new Date().toISOString()
    }
    setQrData(JSON.stringify(dataToExport))
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
          if (parsedData.medicines || parsedData.appointments) {
            setScannedData(parsedData)
            setScanning(false)
            scanner.clear()
            scannerRef.current = null
          } else {
            alert('El código QR no contiene datos válidos del sistema.')
          }
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
          Genera un código QR con toda tu información de medicinas y citas médicas para compartir fácilmente.
        </p>
        
        <div className="qr-actions">
          <button onClick={generateQRCode} className="action-button">
            Generar Código QR
          </button>
        </div>

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
              <p><strong>Total de medicinas:</strong> {medicines.length}</p>
              <p><strong>Total de citas:</strong> {appointments.length}</p>
              <button onClick={downloadQR} className="download-button">
                Descargar QR
              </button>
              <button onClick={() => setQrData(null)} className="clear-button">
                Limpiar
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="qr-section">
        <h2>Escanear Código QR</h2>
        <p className="section-description">
          Escanea un código QR para importar información de medicinas y citas médicas.
        </p>

        {!scanning && !scannedData && (
          <button onClick={startScanning} className="action-button">
            Iniciar Escaneo
          </button>
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
          <li><strong>Para generar QR:</strong> Haz clic en "Generar Código QR" y muestra el código a otra persona o dispositivo para escanearlo.</li>
          <li><strong>Para escanear QR:</strong> Haz clic en "Iniciar Escaneo" y apunta la cámara hacia el código QR. Asegúrate de dar permisos de cámara al navegador.</li>
          <li><strong>Importar datos:</strong> Después de escanear, puedes importar los datos para agregarlos a tu sistema.</li>
        </ul>
      </div>
    </div>
  )
}

export default QRManager

