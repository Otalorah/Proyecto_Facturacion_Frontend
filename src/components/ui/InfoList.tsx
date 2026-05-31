import './info-list.css'

export type InfoListItem = {
   label: string
   value: string | number | null | undefined
}

type InfoListProps = {
   items: InfoListItem[]
}

function InfoList({ items }: InfoListProps) {
   return (
      <dl className="info-list">
         {items.map((item) => (
            <div className="info-list-row" key={item.label}>
               <dt>{item.label}</dt>
               <dd>{item.value ?? '-'}</dd>
            </div>
         ))}
      </dl>
   )
}

export default InfoList
