// <Tour src="/tours/<nazov>/tour.json" edit={false} />
//
// Jeden komponent, dva režimy:
//   VIEW  – návštevník: 360° prehliadka, flagy (prechody), pôdorys.
//   EDIT  – len ty (?edit=1): klik-to-place flagy, pôdorys, export tour.json.
//
// PSV (Photo Sphere Viewer) je imperatívny, preto ho držíme v ref a inicializujeme
// raz. Editačné zmeny tlačíme do pluginu cez updateNode() bez re-inicializácie.

import { useCallback, useEffect, useRef, useState } from 'react';
import { Viewer } from '@photo-sphere-viewer/core';
import { VirtualTourPlugin } from '@photo-sphere-viewer/virtual-tour-plugin';
import { MarkersPlugin } from '@photo-sphere-viewer/markers-plugin';
import { GyroscopePlugin } from '@photo-sphere-viewer/gyroscope-plugin';
import '@photo-sphere-viewer/core/index.css';
import '@photo-sphere-viewer/markers-plugin/index.css';

import FloorPlan from './FloorPlan.jsx';
import Editor from './Editor.jsx';
import CommentPanel from './CommentPanel.jsx';
import { loadTour, toPsvNode, toExportJson } from './tourData.js';
import arrowUrl from './arrow.svg';
import './tour.css';

export default function Tour({ src, edit = false }) {
  const containerRef = useRef(null);
  const viewerRef = useRef(null);
  const vtRef = useRef(null);
  const tourRef = useRef(null); // vždy aktuálny tour (pre imperatívne callbacky)
  const variantRef = useRef(null); // aktuálny svetelný režim (id)

  const [tour, setTour] = useState(null);
  const [baseUrl, setBaseUrl] = useState('');
  const [currentNodeId, setCurrentNodeId] = useState(null);
  const [variant, setVariant] = useState(null);
  const [placingTarget, setPlacingTarget] = useState(null);
  const [error, setError] = useState(null);

  // Komentáre: globálny prepínač (s/bez) + evidencia už automaticky prehratých
  // záberov (aby sa audio prehralo len raz pri prvom vstupe).
  const [commentsOn, setCommentsOn] = useState(true);
  const playedRef = useRef(new Set());

  // INFO body: globálny prepínač (biele bodky), otvorený bod, režim umiestňovania.
  const markersRef = useRef(null);
  const infoIdsRef = useRef(new Set()); // id markerov, ktoré sme pridali my
  const infoOnRef = useRef(true);
  const currentNodeIdRef = useRef(null);
  const [infoOn, setInfoOn] = useState(true);
  const [activeInfo, setActiveInfo] = useState(null);
  const [placingInfo, setPlacingInfo] = useState(false);

  // Prekreslí biele bodky aktuálnej scény. Cez refy, aby sa dala volať aj
  // z imperatívnych callbackov (napr. po prepnutí svetelného režimu).
  const refreshInfoMarkers = useCallback(() => {
    const mp = markersRef.current;
    const t = tourRef.current;
    const nodeId = currentNodeIdRef.current;
    if (!mp || !t || !nodeId) return;
    infoIdsRef.current.forEach((id) => {
      try { mp.removeMarker(id); } catch { /* marker už neexistuje */ }
    });
    infoIdsRef.current.clear();
    if (!infoOnRef.current) return;
    const node = t.nodes.find((n) => n.id === nodeId);
    (node?.infos || []).forEach((info) => {
      const id = `info-${info.id}`;
      mp.addMarker({
        id,
        position: { yaw: info.yaw, pitch: info.pitch },
        html: '<div class="ilumi-info-dot"></div>',
        anchor: 'center center',
        ...(info.title ? { tooltip: info.title } : {}),
        data: { info },
      });
      infoIdsRef.current.add(id);
    });
  }, []);

  // drž refy synchronizované so stavom
  useEffect(() => { tourRef.current = tour; }, [tour]);
  useEffect(() => { variantRef.current = variant; }, [variant]);

  // aktuálny objekt svetelného režimu (alebo null, ak sa režimy nepoužívajú)
  const currentVariantObj = () =>
    tourRef.current?.variants?.find((v) => v.id === variantRef.current) || null;

  // 1) Načítaj tour + inicializuj viewer (raz, podľa src)
  useEffect(() => {
    let viewer;
    let cancelled = false;

    loadTour(src)
      .then(({ data, baseUrl }) => {
        if (cancelled || !containerRef.current) return;
        setBaseUrl(baseUrl);
        setTour(data);
        tourRef.current = data;

        const startVariantId = data.defaultVariant;
        variantRef.current = startVariantId;
        setVariant(startVariantId);
        const startVariantObj = data.variants?.find((v) => v.id === startVariantId) || null;

        const startId = data.startNodeId || data.nodes[0]?.id;
        viewer = new Viewer({
          container: containerRef.current,
          defaultZoomLvl: 0,
          // 'gyroscope' = tlačidlo na zapnutie ovládania pohybom telefónu (mobil).
          // Na zariadeniach bez senzora sa tlačidlo automaticky skryje.
          navbar: ['zoom', 'gyroscope', 'fullscreen'],
          plugins: [
            MarkersPlugin,
            GyroscopePlugin,
            [
              VirtualTourPlugin,
              {
                positionMode: 'manual',
                renderMode: '3d',
                nodes: data.nodes.map((n) => toPsvNode(n, baseUrl, startVariantObj)),
                startNodeId: startId,
                preload: true, // prednačítaj susedné scény = plynulý prechod
                transitionOptions: { effect: 'fade', speed: '15rpm', rotation: true },
                // vlastná minimalistická šípka — rovnaký vzhľad na PC aj mobile
                arrowStyle: { image: arrowUrl, size: { width: 70, height: 70 } },
              },
            ],
          ],
        });
        viewerRef.current = viewer;
        const vt = viewer.getPlugin(VirtualTourPlugin);
        vtRef.current = vt;
        setCurrentNodeId(startId);
        vt.addEventListener('node-changed', ({ node }) => {
          setCurrentNodeId(node.id);
          setActiveInfo(null); // otvorený INFO bod pri prechode zavri
        });

        // INFO body: klik na bielu bodku otvorí panel s textom/odkazom
        const mp = viewer.getPlugin(MarkersPlugin);
        markersRef.current = mp;
        mp.addEventListener('select-marker', ({ marker }) => {
          if (String(marker.id).startsWith('info-')) setActiveInfo(marker.data?.info || null);
        });
      })
      .catch((e) => setError(String(e.message || e)));

    return () => {
      cancelled = true;
      if (viewer) viewer.destroy();
      viewerRef.current = null;
      vtRef.current = null;
      markersRef.current = null;
      infoIdsRef.current.clear();
    };
  }, [src]);

  // 2) Navigácia (pôdorys, programovo)
  const navigate = useCallback((nodeId) => {
    vtRef.current?.setCurrentNode(nodeId);
  }, []);

  // Prepnutie svetelného režimu (Deň / Svetlá / Noc) — znovu načíta panorámy
  // s príslušným suffixom, pričom ostane v aktuálnej scéne aj pohľade.
  const switchVariant = useCallback((variantId) => {
    const viewer = viewerRef.current;
    const vt = vtRef.current;
    const t = tourRef.current;
    if (!viewer || !vt || !t) return;
    const variantObj = t.variants?.find((v) => v.id === variantId) || null;
    const pos = viewer.getPosition();
    variantRef.current = variantId;
    setVariant(variantId);
    // po načítaní scény obnov pôvodný pohľad + INFO body (setNodes ich zmaže)
    const restore = () => {
      viewer.rotate(pos);
      refreshInfoMarkers();
      vt.removeEventListener('node-changed', restore);
    };
    vt.addEventListener('node-changed', restore);
    vt.setNodes(t.nodes.map((n) => toPsvNode(n, baseUrl, variantObj)), currentNodeId);
  }, [baseUrl, currentNodeId, refreshInfoMarkers]);

  // INFO body: prekresli pri prechode do inej miestnosti, prepnutí INFO
  // alebo úprave bodov v editore. (Refy drž synchronizované so stavom.)
  useEffect(() => {
    infoOnRef.current = infoOn;
    currentNodeIdRef.current = currentNodeId;
    refreshInfoMarkers();
  }, [tour, currentNodeId, infoOn, refreshInfoMarkers]);

  // 3) EDIT: zachytenie kliku v 360° počas "placing" režimu (flag alebo INFO bod)
  useEffect(() => {
    const viewer = viewerRef.current;
    if (!edit || (!placingTarget && !placingInfo) || !viewer) return;

    const onClick = (e) => {
      const { yaw, pitch } = e.data;
      if (placingInfo) {
        addInfo(currentNodeId, yaw, pitch);
        setPlacingInfo(false);
      } else {
        addLink(currentNodeId, placingTarget, yaw, pitch);
        setPlacingTarget(null);
      }
    };
    viewer.addEventListener('click', onClick);
    return () => viewer.removeEventListener('click', onClick);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [edit, placingTarget, placingInfo, currentNodeId]);

  // --- editačné operácie (menia React stav + tlačia do PSV pluginu) ---

  const pushNodeToPlugin = useCallback((node) => {
    vtRef.current?.updateNode({
      id: node.id,
      links: node.links.map((l) => ({ nodeId: l.nodeId, position: { yaw: l.yaw, pitch: l.pitch } })),
    });
  }, []);

  const addLink = useCallback((fromId, toId, yaw, pitch) => {
    setTour((prev) => {
      const nodes = prev.nodes.map((n) => {
        if (n.id !== fromId) return n;
        const links = n.links.filter((l) => l.nodeId !== toId).concat({ nodeId: toId, yaw, pitch });
        const updated = { ...n, links };
        pushNodeToPlugin(updated);
        return updated;
      });
      return { ...prev, nodes };
    });
  }, [pushNodeToPlugin]);

  const removeLink = useCallback((fromId, toId) => {
    setTour((prev) => {
      const nodes = prev.nodes.map((n) => {
        if (n.id !== fromId) return n;
        const updated = { ...n, links: n.links.filter((l) => l.nodeId !== toId) };
        pushNodeToPlugin(updated);
        return updated;
      });
      return { ...prev, nodes };
    });
  }, [pushNodeToPlugin]);

  const addNode = useCallback((name, file) => {
    const id = slugify(name) || `room-${Date.now()}`;
    setTour((prev) => {
      if (prev.nodes.some((n) => n.id === id)) return prev; // duplicitné id
      const node = { id, name, panorama: file, links: [] };
      vtRef.current?.setNodes(
        [...prev.nodes, node].map((n) => toPsvNode(n, baseUrl, currentVariantObj())),
        prev.startNodeId || id,
      );
      return { ...prev, nodes: [...prev.nodes, node], startNodeId: prev.startNodeId || id };
    });
  }, [baseUrl]);

  const setRoom = useCallback((nodeId, x, y) => {
    if (!nodeId) return;
    setTour((prev) => {
      const rooms = (prev.floorplan?.rooms || []).filter((r) => r.nodeId !== nodeId);
      const label = prev.nodes.find((n) => n.id === nodeId)?.name;
      rooms.push({ nodeId, x, y, label });
      return {
        ...prev,
        floorplan: { image: prev.floorplan?.image || '', rooms },
      };
    });
  }, []);

  const setStart = useCallback((nodeId) => {
    setTour((prev) => ({ ...prev, startNodeId: nodeId }));
  }, []);

  const removeNode = useCallback((nodeId) => {
    const prev = tourRef.current;
    if (!prev || prev.nodes.length <= 1) return; // nechaj aspoň jednu miestnosť
    // zmaž uzol + všetky flagy, ktoré naň mierili z iných miestností
    const nodes = prev.nodes
      .filter((n) => n.id !== nodeId)
      .map((n) => ({ ...n, links: n.links.filter((l) => l.nodeId !== nodeId) }));
    const rooms = (prev.floorplan?.rooms || []).filter((r) => r.nodeId !== nodeId);
    const startNodeId = prev.startNodeId === nodeId ? nodes[0].id : prev.startNodeId;
    // ak práve stojíme v mazanej miestnosti, presuň sa na štart
    const stayOn = currentNodeId === nodeId ? startNodeId : currentNodeId;
    const next = {
      ...prev,
      nodes,
      startNodeId,
      floorplan: prev.floorplan ? { ...prev.floorplan, rooms } : null,
    };
    tourRef.current = next;
    setTour(next);
    vtRef.current?.setNodes(nodes.map((n) => toPsvNode(n, baseUrl, currentVariantObj())), stayOn);
    setCurrentNodeId(stayOn);
  }, [baseUrl, currentNodeId]);

  // Komentár k záberu (audio/text) — čisto React overlay, netreba tlačiť do PSV.
  const setComment = useCallback((nodeId, comment) => {
    setTour((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, comment } : n)),
    }));
  }, []);

  // INFO body aktuálnej scény (editor) — bodky prekreslí efekt vyššie.
  const setInfos = useCallback((nodeId, infos) => {
    setTour((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) => (n.id === nodeId ? { ...n, infos } : n)),
    }));
  }, []);

  const addInfo = useCallback((nodeId, yaw, pitch) => {
    setTour((prev) => ({
      ...prev,
      nodes: prev.nodes.map((n) =>
        n.id === nodeId
          ? { ...n, infos: [...(n.infos || []), { id: `i-${Date.now()}`, yaw, pitch, title: 'Nový bod', text: '', link: '' }] }
          : n,
      ),
    }));
  }, []);

  // Zmena zoznamu svetelných režimov (editor). defaultVariant držíme platný.
  const setVariants = useCallback((variants) => {
    setTour((prev) => {
      const defaultVariant = variants.some((v) => v.id === prev.defaultVariant)
        ? prev.defaultVariant
        : variants[0]?.id || null;
      return { ...prev, variants, defaultVariant };
    });
  }, []);

  const exportJson = useCallback(() => {
    const json = toExportJson(tourRef.current);
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'tour.json';
    a.click();
    URL.revokeObjectURL(url);
  }, []);

  if (error) {
    return (
      <div className="ilumi-tour ilumi-tour--error">
        <div>
          <strong>Chyba pri načítaní prehliadky.</strong>
          <p>{error}</p>
          <p className="ilumi-tour__hint">Skontroluj, či <code>{src}</code> existuje a či sú obrázky v správnom priečinku.</p>
        </div>
      </div>
    );
  }

  const currentNode = tour?.nodes.find((n) => n.id === currentNodeId);

  return (
    <div className={`ilumi-tour ${edit ? 'is-edit' : ''}`}>
      <div className="ilumi-tour__viewer" ref={containerRef} />

      {/* Prepínač svetelných režimov (Deň / Svetlá / Noc) */}
      {tour?.variants?.length > 1 && (
        <div className="ilumi-variants">
          {tour.variants.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`ilumi-variants__btn ${v.id === variant ? 'is-active' : ''}`}
              onClick={() => switchVariant(v.id)}
            >
              {v.label}
            </button>
          ))}
        </div>
      )}

      {/* INFO body: prepínač (zobrazí sa, len ak prehliadka nejaké má) */}
      {tour?.nodes.some((n) => n.infos?.length > 0) && (
        <button
          type="button"
          className={`ilumi-info-toggle ${infoOn ? 'is-active' : ''}`}
          title={infoOn ? 'Skryť info body' : 'Zobraziť info body'}
          onClick={() => {
            setInfoOn((v) => !v);
            setActiveInfo(null);
          }}
        >
          ⓘ INFO
        </button>
      )}

      {/* Otvorený INFO bod (klik na bielu bodku) */}
      {activeInfo && (
        <div className="ilumi-infopanel">
          <button type="button" className="ilumi-infopanel__close" onClick={() => setActiveInfo(null)}>✕</button>
          {activeInfo.title && <h3 className="ilumi-infopanel__title">{activeInfo.title}</h3>}
          {activeInfo.text && <p className="ilumi-infopanel__text">{activeInfo.text}</p>}
          {activeInfo.link && (
            <a className="ilumi-infopanel__link" href={activeInfo.link} target="_blank" rel="noreferrer">
              Viac info →
            </a>
          )}
        </div>
      )}

      {/* Komentár k aktuálnemu záberu (globálne zapnutý/vypnutý) */}
      {currentNode?.comment?.enabled &&
        (commentsOn ? (
          <CommentPanel
            key={currentNodeId}
            comment={currentNode.comment}
            baseUrl={baseUrl}
            autoPlay={!playedRef.current.has(currentNodeId)}
            onPlayed={() => playedRef.current.add(currentNodeId)}
            onDisable={() => setCommentsOn(false)}
          />
        ) : (
          <button type="button" className="ilumi-comment__enable" onClick={() => setCommentsOn(true)}>
            🔊 Zapnúť komentár
          </button>
        ))}

      {tour?.floorplan?.image && (
        <FloorPlan
          floorplan={tour.floorplan}
          baseUrl={baseUrl}
          currentNodeId={currentNodeId}
          edit={edit}
          onNavigate={navigate}
          onSetRoom={setRoom}
        />
      )}

      {edit && tour && (
        <Editor
          tour={tour}
          currentNodeId={currentNodeId}
          placingTarget={placingTarget}
          placingInfo={placingInfo}
          onAddNode={addNode}
          onStartPlacing={setPlacingTarget}
          onStartPlacingInfo={() => setPlacingInfo(true)}
          onCancelPlacing={() => {
            setPlacingTarget(null);
            setPlacingInfo(false);
          }}
          onSetInfos={setInfos}
          onRemoveLink={removeLink}
          onRemoveNode={removeNode}
          onSetStart={setStart}
          onSetComment={setComment}
          onSetVariants={setVariants}
          activeVariant={variant}
          onSwitchVariant={switchVariant}
          onExport={exportJson}
        />
      )}
    </div>
  );
}

function slugify(s) {
  // odstráň diakritiku: NFD rozloží znaky a combining marks (U+0300–U+036F) zahodíme
  const combining = new RegExp('[' + String.fromCharCode(0x300) + '-' + String.fromCharCode(0x36f) + ']', 'g');
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(combining, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
