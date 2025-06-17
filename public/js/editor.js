import { loadComponentsUi } from "./componentsui.js";
const salaId = document.getElementById("salaId").value; // Si lo estás pasando de alguna forma

document.addEventListener("DOMContentLoaded", function () {
  const socket = io();
  const editor = grapesjs.init({
    container: "#gjs",
    height: "100vh",
    width: "auto",
    fromElement: true,
    storageManager: false,
    pageManager: { pages: [] },
    deviceManager: {
      devices: [
        { name: "Desktop", width: "" },
        { name: "Mobile", width: "320px", widthMedia: "480px" },
      ],
    },
  });

  const pageManager = editor.Pages;
  const addPageBtn = document.getElementById("addPageBtn");
  const pageSelector = document.getElementById("pageSelector");
  const deletePageBtn = document.getElementById("deletePageBtn");

  let actualizandoDesdeSocket = false;

  function actualizarSelector() {
    pageSelector.innerHTML = "";
    pageManager.getAll().forEach((page) => {
      const option = document.createElement("option");
      option.value = page.id;
      option.text = page.get("name") || page.id;
      pageSelector.appendChild(option);
    });
  }

  editor.on("load", () => {
    editor.setDevice("Mobile");
  });

  socket.on("init", (proyectoInicial) => {
    if (proyectoInicial?.pages?.length) {
      console.log("📥 Recibiendo proyecto inicial", proyectoInicial);
      actualizandoDesdeSocket = true;

      const primeraPagina = proyectoInicial.pages[0];

      editor.loadProjectData({
        pages: [primeraPagina],
        styles: [],
      });

      editor.setStyle(primeraPagina.styles || []);

      setTimeout(() => {
        actualizarSelector();
        pageManager.select(primeraPagina.id);
        actualizandoDesdeSocket = false;
      }, 500);
    }
  });

function enviarProyecto() {
  if (actualizandoDesdeSocket) return; // ⛔ Evita enviar si es una actualización externa

  const currentPage = pageManager.getSelected();
  const currentPageId = currentPage?.id;

  const allPages = editor.getProjectData().pages;

  const pages = allPages.map((page) => {
    const isCurrent = page.id === currentPageId;

    // ✅ Asegurar que cada página tenga `frames`
    const frames = isCurrent
      ? editor.getProjectData().pages.find(p => p.id === page.id)?.frames || editor.getProjectData().pages[0].frames
      : page.frames || [{ component: `<h1>Página vacía</h1>` }];

    // ✅ Asegurar estilos por página
    const styles = isCurrent
      ? editor.getStyle()
      : page.styles || [];

    return {
      ...page,
      frames,
      styles,
    };
  });

  const proyecto = {
    assets: editor.getProjectData().assets || [],
    pages,
    symbols: [],
    styles: [] // ✅ Evitar estilos globales
  };

  socket.emit("guardarProyecto", proyecto);
  console.log("✅ Proyecto enviado al servidor:", proyecto);
}

  pageSelector.addEventListener("change", (e) => {
    const selectedPageId = e.target.value;
    const pageData = editor.getProjectData().pages.find(
      (p) => p.id === selectedPageId
    );

    if (pageData) {
      editor.DomComponents.clear();
      editor.Css.clear();

      editor.loadProjectData({
        pages: [pageData],
        styles: [],
      });

      editor.setStyle(pageData.styles || []);
      pageManager.select(selectedPageId);
    }
  });

  addPageBtn.addEventListener("click", () => {
    const pageName = prompt("Ingrese el nombre de la nueva página:");
    if (pageName) {
      const newPage = pageManager.add({
        name: pageName,
        component: `<h1>${pageName}</h1><p>Contenido inicial de ${pageName}.</p>`,
      });
      pageManager.select(newPage.id);
      actualizarSelector();
    }
  });

  deletePageBtn.addEventListener("click", () => {
    const selectedPageId = pageSelector.value;
    if (!selectedPageId) {
      alert("Primero selecciona una página para eliminar.");
      return;
    }

    const confirmDelete = confirm(
      `¿Seguro que quieres eliminar la página "${selectedPageId}"?`
    );
    if (!confirmDelete) return;

    const pageToDelete = pageManager.get(selectedPageId);
    if (pageToDelete) {
      pageManager.remove(pageToDelete);
      actualizarSelector();

      const remainingPages = pageManager.getAll();
      if (remainingPages.length > 0) {
        pageManager.select(remainingPages[0].id);
      } else {
        console.log("No hay más páginas disponibles.");
      }

      enviarProyecto();
    }
  });

  editor.on("component:add", enviarProyecto);
  editor.on("component:remove", enviarProyecto);
  editor.on("page:add", enviarProyecto);
  editor.on("page:remove", enviarProyecto);

  socket.on("actualizarProyecto", (proyecto) => {
    actualizandoDesdeSocket = true;
    const currentProject = editor.getProjectData();

    if (JSON.stringify(currentProject) !== JSON.stringify(proyecto)) {
      console.log("♻️ Actualizando proyecto completo desde otro usuario");

      const primeraPagina = proyecto.pages[0];

      editor.loadProjectData({
        pages: [primeraPagina],
        styles: [],
      });

      editor.setStyle(primeraPagina.styles || []);

      setTimeout(() => {
        actualizarSelector();
        pageManager.select(primeraPagina.id);
        actualizandoDesdeSocket = false;
      }, 500);
    } else {
      console.log("Sin cambios detectados.");
    }
  });

  const aiDesign = window.aiDesign || null;
  const loadAiDesignBtn = document.getElementById("loadAiDesignBtn");

  if (aiDesign && loadAiDesignBtn) {
    loadAiDesignBtn.addEventListener("click", async () => {
      const html = aiDesign.html;
      const css = aiDesign.css;

      const newPage = pageManager.add({
        name: `DiseñoAI${Date.now()}`,
      });

      pageManager.select(newPage.id);
      editor.DomComponents.clear();
      editor.Css.clear();
      editor.setComponents(html);
      editor.setStyle(css);

      // ✅ Guardar CSS dentro de la página
      const currentPage = pageManager.getSelected();
      currentPage.set("styles", editor.getStyle());

      actualizarSelector();
      enviarProyecto();

      console.log("✅ Diseño AI cargado exitosamente");
    });
  }

  loadComponentsUi(editor);
  socket.emit("joinRoom", { salaId });

  editor.Panels.getButton("views", "open-blocks").set("active", true);
  actualizarSelector();
});
