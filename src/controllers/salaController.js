import Sala from "../models/salaModel.js";
import path from "path";
import fs from "fs-extra";
import { fileURLToPath } from "url";
import { dirname } from "path";
import { OpenAI } from "openai";
import "dotenv/config";

// __dirname workaround para ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

import { GoogleGenerativeAI } from "@google/generative-ai";

const ai = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
export async function indexSala(req, res) {
  try {
    const userId = req.session.userId;
    const salas = await Sala.getAllSalasUser(userId);
    const baseUrl = process.env.BASE_URL;
    res.render("salas", { title: "Mis Salas", salas, baseUrl });
  } catch (error) {
    res.status(500).json({ message: "Error retrieving salas" });
  }
}

export async function storeSala(req, res) {
  try {
    res.render("create_sala", { title: "Creación de Sala" });
  } catch (error) {
    console.error("Error retrieving salas:", error);
    res.status(500).json({ message: "Error retrieving salas" });
  }
}

export async function editSala(req, res) {
  const { id } = req.params;
  const response = await Sala.getSala(id);
  const sala = response[0];
  try {
    res.render("edit_sala", { title: "Editar Sala", sala });
  } catch (error) {
    console.error("Error al obtener la sala:", error);
    res.status(500).send("Error al obtener los datos de la sala");
  }
}

export async function createSala(req, res) {
  try {
    const userId = req.session.userId;
    const { title, description } = req.body;
    const sala = await Sala.createSala(title, description, userId);

    if (sala != null) {
      res.redirect("/index-sala");
    } else {
      res.render("salas/sala", {
        message: "Error al crear la sala. Inténtalo de nuevo.",
      });
    }
  } catch (error) {
    res.status(500).json({ message: "Error creating sala" });
  }
}

export async function updateSala(req, res) {
  try {
    const { id, title, description } = req.body;
    await Sala.editSala(title, description, id);
    res.redirect("/index-sala");
  } catch (error) {
    console.error("Error al actualizar la sala:", error);
    res.status(500).send("Error al actualizar la sala");
  }
}

export async function deleteSala(req, res) {
  const { id } = req.params;
  try {
    await Sala.delSala(id);
    res.redirect("/index-sala");
  } catch (error) {
    res.status(500).json({ message: "Error deleting sala" });
  }
}


export async function exportFlutter(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen." });
    }

    const prompt = `
Eres un desarrollador experto en Flutter.

Voy a enviarte una imagen de una interfaz. Tu tarea es analizarla y generar el widget en código Dart equivalente para Flutter 3+.

Devuélveme SOLO un JSON plano con esta estructura:
{
  "widget": "<aquí va el código del widget>"
}

🚫 No uses markdown ni bloques de código (\`\`\`). Solo el JSON plano.
✅ Usa buenas prácticas y estilo limpio.
`;

    const mimeType = req.file.mimetype;
    const base64 = req.file.buffer.toString("base64");

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
    });

    let responseText = result.response.text();

    // Limpiar markdown si hay
    if (responseText.startsWith("```")) {
      responseText = responseText.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const json = JSON.parse(responseText);

    const dartCode = `
import 'package:flutter/material.dart';

class Example extends StatelessWidget {
  const Example({super.key});

  @override
  Widget build(BuildContext context) {
    return ${json.widget};
  }
}
`;

    const outputPath = path.resolve("exports/flutter_widget.dart");

    await fs.outputFile(outputPath, dartCode);

    console.log("✅ Código Dart generado con Gemini");

    res.download(outputPath, "example.dart", async (err) => {
      if (err) console.error("❌ Error al enviar archivo:", err);

      try {
        await fs.unlink(outputPath);
        console.log("🗑️ Archivo eliminado después de enviar");
      } catch (unlinkErr) {
        console.error("🧨 Error al eliminar archivo:", unlinkErr);
      }
    });
  } catch (error) {
    console.error("❌ Error usando Gemini:", error.message);
    res.status(500).json({ error: "Error al generar código Dart con Gemini." });
  }
}


export async function importImg(req, res) {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No se envió ninguna imagen." });
    }

    const prompt = `
Actúa como un desarrollador frontend experto.

Te enviaré una imagen de una interfaz. Tu tarea es analizarla y generar el código HTML y CSS equivalente.

❗ Devuelve únicamente un JSON plano con esta estructura:
{
  "html": "<aquí va el código HTML como string>",
  "css": "<aquí va el código CSS como string>"
}

🚫 No uses bloques de código, no uses markdown, no pongas etiquetas como \`\`\`json. Solo el JSON plano, sin explicación.

Usa buenas prácticas, diseño responsivo, y semántica si es posible.
`;

    const mimeType = req.file.mimetype;
    const base64 = req.file.buffer.toString("base64");

    const model = ai.getGenerativeModel({ model: "gemini-2.0-flash" });

    const result = await model.generateContent({
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64,
              },
            },
          ],
        },
      ],
    });

    let respuesta = result.response.text();
    console.log("✅ Respuesta:", respuesta);

    // 💥 Limpieza si viene con ```json ... ```
    if (respuesta.startsWith("```json") || respuesta.startsWith("```")) {
      respuesta = respuesta.replace(/^```(json)?/, "").replace(/```$/, "").trim();
    }

    const aiDesign = JSON.parse(respuesta);

    res.render("editor", {
      title: "Generador Frontend",
      salaId: req.params.id,
      aiDesign: JSON.stringify(aiDesign), // para el front
    });
  } catch (error) {
    console.error("❌ Error al procesar imagen:", error.message);
    res.status(500).json({ error: "Error al procesar la imagen con Gemini." });
  }
}


export async function importPromt(req, res) {
  try {
    const { mensaje } = req.body;

    const prompt = `
Quiero que actúes como un desarrollador web experto.

Te voy a describir cómo quiero que se vea mi página web.

Devuélveme únicamente un objeto JSON plano con dos claves: "html" y "css", cada una conteniendo su respectivo contenido como string.

No uses markdown, ni etiquetas especiales, ni bloques de código.

Solo quiero el JSON plano.

Usa buenas prácticas, estilo responsivo, y comenta dentro del código si lo crees necesario.

Esta es la descripción de la página que quiero:
${mensaje}
`;

    const response = await ai.models.generateContent({
      model: "gemini-2.0-flash",
      contents: "Te pudo pasar una imagen?",
    });

    const text = response?.response?.text || response.text;
    console.log("Respuesta de Gemini:", text);

    // Aquí podrías hacer un JSON.parse(text) si estás seguro que devuelve JSON válido

    /* res.render('editor', {
      title: 'Generador Frontend',
      salaId: req.params.id,
      aiDesign: JSON.stringify(JSON.parse(text)),
    }); */
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error al procesar el prompt con Gemini." });
  }
}
