import { Router } from 'express';
import { getNextOrderNumberHandler, processReception } from '../controllers/receptionController.js';
import { upload, processUploadedFile } from '../utils/uploader.js';

const router = Router();

router.get('/next-number', getNextOrderNumberHandler);
router.post('/', processReception);

// Subida de fotografías con soporte Cloudinary y almacenamiento seguro
router.post('/upload-photo', upload.single('photo'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se recibió ningún archivo de imagen.' });
    }
    const result = await processUploadedFile(req.file);
    return res.json(result);
  } catch (err) {
    console.error('Error al subir fotografía:', err);
    return res.status(500).json({ error: 'Error al procesar la fotografía.' });
  }
});

export default router;
