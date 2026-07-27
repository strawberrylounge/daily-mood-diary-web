"use client";

import Modal from "@/components/common/Modal";
import { getScoreColor } from "@/utils/score";

import { scoreGuides } from "./scoreGuides";

import styles from "./GuideModal.module.scss";
import modalStyles from "../common/Modal.module.scss";

interface GuideModalProps {
  guideKey: string | null;
  onClose: () => void;
}

export default function GuideModal({ guideKey, onClose }: GuideModalProps) {
  const guide = guideKey ? scoreGuides[guideKey] : null;

  return (
    <Modal isOpen={!!guide} onClose={onClose} title={guide?.title}>
      {guide && (
        <div
          className={`${modalStyles["guide-modal-wrap"]} ${styles.container}`}
        >
          {guide.subtitle && (
            <h5 className={styles.subtitle}>{guide.subtitle}</h5>
          )}
          {guide.subtitleDescription && (
            <p
              className={styles.description}
              dangerouslySetInnerHTML={{ __html: guide.subtitleDescription }}
            ></p>
          )}
          <table className={styles.table}>
            <colgroup>
              <col width="56px" />
              <col width="*" />
            </colgroup>
            <thead>
              <tr>
                <th>점수</th>
                <th>평가 기준</th>
              </tr>
            </thead>
            <tbody>
              {guide.table.map((row) => (
                <tr key={row.score}>
                  <td style={{ backgroundColor: getScoreColor(row.score) }}>
                    {row.score}
                  </td>
                  <td dangerouslySetInnerHTML={{ __html: row.description }} />
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </Modal>
  );
}
